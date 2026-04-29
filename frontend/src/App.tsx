// @ts-nocheck
import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Link as LinkIcon, X, Sparkles, ExternalLink, Loader2, UploadCloud, Image as ImageIcon, Film, Trash2, Shuffle, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem('mwAdminKey') || '');
  const [isAdmin, setIsAdmin] = useState(() => Boolean(sessionStorage.getItem('mwAdminKey')));
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 日期筛选与总结状态
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [selectedDate, setSelectedDate] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
  const [panelYear, setPanelYear] = useState(new Date().getFullYear());
  const datePickerRef = useRef<HTMLDivElement>(null);

  // 上传与编辑状态
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(''); 
  const [uploadData, setUploadData] = useState({ sourceLink: '', mwIdea: '', customTags: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [editIdea, setEditIdea] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editSourceLink, setEditSourceLink] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    }
    if (showDatePicker) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDatePicker]);

  const handlePrevMonth = () => {
    if (selectedDate.month === 1) setSelectedDate({ year: selectedDate.year - 1, month: 12 });
    else setSelectedDate({ ...selectedDate, month: selectedDate.month - 1 });
  };
  const handleNextMonth = () => {
    if (selectedDate.month === 12) setSelectedDate({ year: selectedDate.year + 1, month: 1 });
    else setSelectedDate({ ...selectedDate, month: selectedDate.month + 1 });
  };

  const fetchImages = () => {
    fetch('/api/images') 
      .then(res => res.json())
      .then(data => {
        const parsedData = data.map((img: any) => ({
          ...img,
          tags: typeof img.aiTags === 'string' ? JSON.parse(img.aiTags) : (img.aiTags || []),
          tips: img.mwIdea || '',
          createdAt: img.createdAt ? new Date(img.createdAt) : new Date() 
        }));
        setImages(parsedData.sort((a, b) => b.id - a.id));
        setIsLoading(false);
      })
      .catch(err => { console.error("读取失败:", err); setIsLoading(false); });
  };

  useEffect(() => { fetchImages(); }, []);

  useEffect(() => {
    if (selectedImage) {
      setEditIdea(selectedImage.tips || '');
      setEditTags(selectedImage.tags?.join(' ') || '');
      setEditSourceLink(selectedImage.sourceLink || '');
      setEditFile(null);
      setEditPreviewUrl('');
    }
  }, [selectedImage]);

  useEffect(() => {
    return () => {
      if (editPreviewUrl) URL.revokeObjectURL(editPreviewUrl);
    };
  }, [editPreviewUrl]);

  const filteredImages = useMemo(() => {
    return images.filter(img => 
      img.createdAt.getFullYear() === selectedDate.year && 
      img.createdAt.getMonth() + 1 === selectedDate.month
    );
  }, [images, selectedDate]);

  const summaryStats = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    let totalTags = 0;
    filteredImages.forEach(img => {
      img.tags.forEach(tag => { tagCounts[tag] = (tagCounts[tag] || 0) + 1; totalTags++; });
    });
    const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { totalItems: filteredImages.length, totalTags, topTags };
  }, [filteredImages]);

  const shuffleDisplay = () => setImages([...images].sort(() => Math.random() - 0.5));

  const clearAdminSession = () => {
    sessionStorage.removeItem('mwAdminKey');
    setAdminKey('');
    setIsAdmin(false);
  };

  const handleAdminExpired = () => {
    clearAdminSession();
    alert('主理人权限已失效，请重新验证');
  };

  const getAdminHeaders = () => ({ 'x-mw-admin-key': adminKey });

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!window.confirm('确定要删除这条灵感吗？')) return;
    try {
      const res = await fetch(`/api/images/${id}`, { method: 'DELETE', headers: getAdminHeaders() });
      if (res.status === 401) {
        handleAdminExpired();
        return;
      }
      if (res.ok) {
        setImages(images.filter(img => img.id !== id));
        setSelectedImage(null);
      }
    } catch (error) { alert('删除失败'); }
  };

  const handleSaveEdit = async () => {
    if (!selectedImage) return;
    setIsSaving(true);
    const newTagsArray = editTags.split(' ').filter(t => t.trim() !== '');
    try {
      const requestOptions: RequestInit = { method: 'PATCH' };

      if (editFile) {
        const formData = new FormData();
        formData.append('file', editFile);
        formData.append('mwIdea', editIdea);
        formData.append('aiTags', JSON.stringify(newTagsArray));
        formData.append('sourceLink', editSourceLink);
        requestOptions.headers = getAdminHeaders();
        requestOptions.body = formData;
      } else {
        requestOptions.headers = { 'Content-Type': 'application/json', ...getAdminHeaders() };
        requestOptions.body = JSON.stringify({ mwIdea: editIdea, aiTags: JSON.stringify(newTagsArray), sourceLink: editSourceLink });
      }

      const res = await fetch(`/api/images/${selectedImage.id}`, requestOptions);
      if (res.status === 401) {
        handleAdminExpired();
        return;
      }
      if (res.ok) {
        const updatedImage = await res.json();
        fetchImages();
        setSelectedImage({ ...selectedImage, imageUrl: updatedImage.imageUrl || selectedImage.imageUrl, tips: editIdea, tags: newTagsArray, sourceLink: editSourceLink });
        setEditFile(null);
        setEditPreviewUrl('');
      }
    } catch (error) { alert('保存错误'); } 
    finally { setIsSaving(false); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (editPreviewUrl) URL.revokeObjectURL(editPreviewUrl);
      setEditFile(file);
      setEditPreviewUrl(URL.createObjectURL(file));
    }
  };

  // --- 核心新增：前端无感压缩引擎 ---
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1920; // 视网膜级清晰度上限
          const MAX_HEIGHT = 1920;
          let width = img.width;
          let height = img.height;

          // 等比例缩放计算
          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // 导出为 85% 质量的 JPEG (画质肉眼无损，体积巨幅减小)
          canvas.toBlob((blob) => {
            if (blob) {
              const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg', lastModified: Date.now() });
              resolve(newFile);
            } else {
              resolve(file); // 压缩失败则退回原图
            }
          }, 'image/jpeg', 0.85);
        };
      };
    });
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return alert('请先选择文件！');
    setIsUploading(true);

    let finalFileToUpload = selectedFile;
    // 如果是图片，并且大于 500KB，启动自动瘦身
    if (selectedFile.type.startsWith('image/') && selectedFile.size > 500 * 1024) {
      finalFileToUpload = await compressImage(selectedFile);
    }

    const formData = new FormData();
    formData.append('file', finalFileToUpload);
    formData.append('sourceLink', uploadData.sourceLink);
    formData.append('mwIdea', uploadData.mwIdea);
    
    const customTagsArray = uploadData.customTags.split(' ').filter(t => t.trim() !== '');
    formData.append('aiTags', JSON.stringify(customTagsArray));

    formData.append('rotation', (Math.random() * 3 - 1.5).toString());
    const types = ['tape', 'pin-gold', 'pin-dark', 'clip'];
    formData.append('decoration', types[Math.floor(Math.random() * types.length)]);
    formData.append('decPosition', (Math.random() * 20 + 40).toString());

    try {
      const response = await fetch('/api/images', { method: 'POST', headers: getAdminHeaders(), body: formData });
      if (response.status === 401) {
        handleAdminExpired();
        return;
      }
      if (response.ok) {
        setUploadData({ sourceLink: '', mwIdea: '', customTags: '' });
        setSelectedFile(null); setPreviewUrl(''); setShowUploadModal(false);
        fetchImages(); 
      } else {
        alert(`入库失败，请检查终端日志`);
      }
    } catch (error) { alert('网络错误'); }
    finally { setIsUploading(false); }
  };

  const isVideo = (url: string) => url?.match(/\.(mp4|webm|ogg|mov)$/i) !== null;

  const handleSecretToggle = () => {
    if (isAdmin) {
      clearAdminSession();
    } else {
      const passcode = window.prompt("Admin access: enter the admin key");
      if (passcode && passcode.trim()) {
        const normalizedKey = passcode.trim();
        sessionStorage.setItem('mwAdminKey', normalizedKey);
        setAdminKey(normalizedKey);
        setIsAdmin(true);
      } else if (passcode !== null) {
        alert("Access Denied / 访问拒绝");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#333333] p-6 md:p-10 font-sans selection:bg-[#Cfa76f] flex flex-col relative">
      
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:justify-between md:items-end gap-6 w-full border-b border-gray-200/50 pb-8 mt-2">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-canger text-4xl md:text-5xl tracking-wide text-[#333333] mb-1 select-none">
            Ideaboard
          </h1>
          <p className={`text-xs md:text-sm mt-0.5 tracking-wide ${isAdmin ? 'font-bold text-[#Cfa76f] animate-pulse' : 'font-medium text-gray-400'}`}>
            轻量级图片 / 视频灵感板，用于收集视觉参考、标签、来源链接和创意思路{isAdmin ? ' · 主理人模式已开启' : ''}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 relative z-40" ref={datePickerRef}>
          <div className="relative">
            <div className="h-[44px] flex items-center bg-white border border-gray-200/80 rounded-[12px] p-1 shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all hover:border-gray-300">
              <button onClick={handlePrevMonth} className="h-full px-2.5 text-gray-400 hover:text-[#333333] transition-colors rounded-[8px] hover:bg-gray-50 flex items-center"><ChevronLeft size={16} /></button>
              <button onClick={() => { setShowDatePicker(!showDatePicker); setPanelYear(selectedDate.year); }} className="text-sm font-medium text-[#333333] px-3 min-w-[100px] text-center tracking-wide hover:text-[#Cfa76f] transition-colors">
                {selectedDate.year} 年 {selectedDate.month} 月
              </button>
              <button onClick={handleNextMonth} className="h-full px-2.5 text-gray-400 hover:text-[#333333] transition-colors rounded-[8px] hover:bg-gray-50 flex items-center"><ChevronRight size={16} /></button>
            </div>

            <AnimatePresence>
              {showDatePicker && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.08)] rounded-[12px] p-5 w-64 z-50 font-sans">
                  <div className="flex justify-between items-center mb-4">
                    <button onClick={() => setPanelYear(panelYear - 1)} className="p-1 text-gray-400 hover:bg-gray-50 rounded"><ChevronLeft size={16}/></button>
                    <span className="font-bold text-sm text-[#333333]">{panelYear} 年</span>
                    <button onClick={() => setPanelYear(panelYear + 1)} className="p-1 text-gray-400 hover:bg-gray-50 rounded"><ChevronRight size={16}/></button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                      <button key={m} onClick={() => { setSelectedDate({ year: panelYear, month: m }); setShowDatePicker(false); }} className={`py-2 text-sm font-medium rounded-[8px] transition-colors ${selectedDate.month === m && selectedDate.year === panelYear ? 'bg-[#333333] text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'}`}>
                        {m}月
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-5 w-px bg-gray-200 hidden sm:block mx-1"></div>

          <button onClick={() => setShowSummary(true)} className="h-[44px] flex items-center gap-2 px-4 bg-white border border-gray-200/80 rounded-[12px] text-sm font-medium text-gray-600 hover:text-[#333333] hover:border-gray-300 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
            <Sparkles size={16} /> 月度总结
          </button>
          
          <button onClick={shuffleDisplay} className="h-[44px] flex items-center gap-2 px-4 bg-white border border-gray-200/80 rounded-[12px] text-sm font-medium text-gray-600 hover:text-[#333333] hover:border-gray-300 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
            <Shuffle size={16} />
          </button>

          {isAdmin && (
            <motion.button initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} onClick={() => setShowUploadModal(true)} className="h-[44px] flex items-center gap-2 px-6 bg-[#333333] text-white rounded-[12px] text-sm font-medium tracking-wide hover:bg-[#Cfa76f] transition-all shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_20px_rgba(207,167,111,0.3)] ml-1">
              <Plus size={16} /> 上传灵感
            </motion.button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full pb-20">
        {isLoading ? (
          <div className="py-40 text-center animate-pulse text-gray-300 tracking-widest">读取灵感库中...</div>
        ) : filteredImages.length === 0 ? (
          <div className="py-40 text-center border border-dashed border-gray-200 rounded-[12px] bg-white/50 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
            <h3 className="font-canger text-3xl text-gray-300">当月画布空空如也</h3>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {filteredImages.map((img) => (
              <IdeaboardCard key={img.id} data={img} isAdmin={isAdmin} onDelete={(e) => handleDelete(e, img.id)} onClick={() => setSelectedImage(img)} isVideo={isVideo} />
            ))}
          </div>
        )}
      </main>

      <footer className="mt-auto py-8 text-center w-full">
        <p 
          onDoubleClick={handleSecretToggle}
          className="text-[11px] text-gray-300 font-medium tracking-widest select-none cursor-default"
        >
          © {new Date().getFullYear()} Ideaboard. MIT License.
        </p>
      </footer>

      <AnimatePresence>
        {showSummary && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-[#333333]/40 backdrop-blur-sm p-4" onClick={() => setShowSummary(false)}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-sm rounded-[12px] shadow-[0_4px_30px_rgba(0,0,0,0.1)] p-10 relative border border-gray-100 font-sans">
              <button onClick={() => setShowSummary(false)} className="absolute top-5 right-5 text-gray-400 hover:text-[#333333]"><X size={20} /></button>
              <div className="mb-8 border-b border-gray-100 pb-5 text-center relative z-10">
                <h2 className="font-canger text-3xl tracking-wide text-[#333333] mb-2">{selectedDate.month}月小结</h2>
                <p className="text-xs text-gray-400 font-medium tracking-widest uppercase mt-1">Design Vocabulary</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-8 text-center divide-x divide-gray-100">
                <div><div className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-2">Total Items</div><div className="text-3xl font-bold text-[#Cfa76f]">{summaryStats.totalItems}</div></div>
                <div><div className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-2">Terms Found</div><div className="text-3xl font-bold text-[#333333]">{summaryStats.totalTags}</div></div>
              </div>
              <div>
                <div className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-5 text-center">Top Keywords</div>
                {summaryStats.topTags.length === 0 ? (
                  <div className="text-center text-sm text-gray-400">本月暂无标签记录</div>
                ) : (
                  <ul className="space-y-4">
                    {summaryStats.topTags.map(([term, count], i) => (
                      <li key={i} className="flex justify-between items-center text-sm px-2">
                        <span className="flex items-center gap-3"><span className="text-[#Cfa76f] font-bold text-sm w-4">{i + 1}.</span><span className="text-[#333333] font-medium">{term}</span></span>
                        <span className="text-gray-500 text-xs font-semibold bg-gray-50 px-2 py-1 rounded border border-gray-100">{count}x</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-white/90 backdrop-blur-md p-4 md:p-12" onClick={() => setSelectedImage(null)}>
            <button className="absolute top-8 right-8 text-gray-400 hover:text-[#333333] z-[110]"><X size={32} /></button>
            <motion.div initial={{ scale: 0.98 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} className="bg-white w-full max-w-6xl h-[85vh] rounded-[12px] shadow-[0_4px_40px_rgba(0,0,0,0.08)] flex flex-col md:flex-row overflow-hidden border border-gray-100">
	              <div className="flex-[2] bg-[#F9F9F9] flex items-center justify-center p-6 md:p-10 border-r border-gray-100">
	                {(editPreviewUrl ? editFile?.type.startsWith('video/') : isVideo(selectedImage.imageUrl)) ? (
	                  <video src={editPreviewUrl || selectedImage.imageUrl} controls autoPlay muted preload="metadata" className="max-w-full max-h-full rounded-sm shadow-sm" />
	                ) : (
	                  <img src={editPreviewUrl || selectedImage.imageUrl} className="max-w-full max-h-full object-contain rounded-sm shadow-sm" />
	                )}
	              </div>
              <div className="flex-1 p-10 flex flex-col gap-6 overflow-y-auto">
                <div>
                  <h3 className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-2">视觉标签</h3>
                  {isAdmin ? (
                    <input type="text" value={editTags} onChange={e => setEditTags(e.target.value)} placeholder="用空格分隔标签..." className="w-full bg-white border border-gray-200 rounded-[12px] px-4 py-3 text-sm focus:border-[#Cfa76f] outline-none shadow-[0_4px_20px_rgba(0,0,0,0.02)]" />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedImage.tags.map((t, i) => (
                        <span key={i} className="text-xs font-medium bg-[#F9F9F9] text-gray-600 px-3 py-1.5 rounded-[8px] border border-gray-100"># {t}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 核心修改点：主理人模式才显示编辑框，普通模式只靠下方的按钮跳转 */}
	                {isAdmin && (
	                  <div>
	                    <h3 className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-2">更换素材</h3>
	                    <input type="file" accept="image/*,video/*" ref={editFileInputRef} onChange={handleEditFileChange} className="hidden" />
	                    <button onClick={() => editFileInputRef.current?.click()} className="w-full h-[44px] bg-white border border-gray-200 text-[#333333] rounded-[12px] font-medium text-sm hover:bg-gray-50 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center justify-center gap-2">
	                      <UploadCloud size={15} /> {editFile ? '重新选择素材' : '选择新的图片或视频'}
	                    </button>
	                    {editFile && (
	                      <p className="mt-2 text-xs text-gray-400 truncate">已选择：{editFile.name}</p>
	                    )}
	                  </div>
	                )}

                {/* 核心修改点：主理人模式才显示编辑框，普通模式只靠下方的按钮跳转 */}
	                {isAdmin && (
	                  <div>
	                    <h3 className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-2">编辑来源</h3>
	                    <input type="text" value={editSourceLink} onChange={e => setEditSourceLink(e.target.value)} placeholder="输入来源链接..." className="w-full bg-white border border-gray-200 rounded-[12px] px-4 py-3 text-sm focus:border-[#Cfa76f] outline-none shadow-[0_4px_20px_rgba(0,0,0,0.02)]" />
	                  </div>
                )}

                <div className="flex-1 flex flex-col">
                  <h3 className="text-base font-bold text-[#Cfa76f] tracking-widest uppercase mb-2">MW Idea</h3>
                  {isAdmin ? (
                    <textarea value={editIdea} onChange={e => setEditIdea(e.target.value)} placeholder="记录思路..." className="flex-1 w-full bg-white border border-gray-200 rounded-[12px] p-5 text-sm leading-relaxed resize-none focus:border-[#Cfa76f] outline-none min-h-[120px] shadow-[0_4px_20px_rgba(0,0,0,0.02)]" />
                  ) : (
                    <div className="text-[#333333] leading-relaxed text-sm whitespace-pre-wrap">{selectedImage.tips || "暂无记录。"}</div>
                  )}
                </div>
                <div className="flex flex-col gap-3 pt-2">
                  {isAdmin && (
                    <button onClick={handleSaveEdit} disabled={isSaving} className="w-full h-[44px] bg-[#333333] text-white rounded-[12px] font-medium text-sm hover:bg-[#Cfa76f] transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
                      {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> 保存修改</>}
                    </button>
                  )}
                  {/* 核心修改点：只有当存在链接时，才显示跳转按钮 */}
                  {selectedImage.sourceLink && (
                    <button onClick={() => window.open(selectedImage.sourceLink)} className="w-full h-[44px] bg-white border border-gray-200 text-[#333333] rounded-[12px] font-medium text-sm hover:bg-gray-50 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                      <ExternalLink size={14} className="inline mr-2 -mt-0.5" /> 访问灵感来源
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUploadModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-[#333333]/40 backdrop-blur-sm p-4" onClick={() => !isUploading && setShowUploadModal(false)}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-lg rounded-[12px] shadow-[0_4px_30px_rgba(0,0,0,0.1)] p-8 md:p-10 relative border border-gray-100 font-sans">
              <button onClick={() => !isUploading && setShowUploadModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-[#333333]"><X size={24} strokeWidth={1.5}/></button>
              <h2 className="font-canger text-3xl text-[#333333] mb-8 uppercase tracking-tighter">入库新灵感</h2>
              <div className="flex flex-col gap-5">
                <div>
                  <input type="file" accept="image/*,video/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                  <div onClick={() => fileInputRef.current?.click()} className={`w-full border border-dashed rounded-[12px] flex flex-col items-center justify-center cursor-pointer transition-all ${previewUrl ? 'border-[#Cfa76f]/50 bg-[#Cfa76f]/5 h-56' : 'border-gray-300 bg-[#F9F9F9] hover:border-[#333333] h-28'}`}>
                    {previewUrl ? (
                      isVideo(selectedFile?.name || '') ? <video src={previewUrl} className="max-h-full max-w-full rounded-[8px]" autoPlay loop muted /> : <img src={previewUrl} className="max-h-full max-w-full object-contain rounded-[8px]" />
                    ) : (
                      <span className="text-sm font-medium text-gray-500">+ 选择媒体文件</span>
                    )}
                  </div>
                </div>
                <input type="text" value={uploadData.customTags} onChange={e => setUploadData({...uploadData, customTags: e.target.value})} placeholder="输入标签，用空格隔开 (选填，AI会辅佐识别)" className="w-full h-[44px] bg-[#F9F9F9] border border-gray-200 rounded-[12px] px-4 text-sm focus:border-[#Cfa76f] focus:bg-white outline-none transition-all" />
                <input type="text" value={uploadData.sourceLink} onChange={e => setUploadData({...uploadData, sourceLink: e.target.value})} placeholder="来源链接 (选填)" className="w-full h-[44px] bg-[#F9F9F9] border border-gray-200 rounded-[12px] px-4 text-sm focus:border-[#Cfa76f] focus:bg-white outline-none transition-all" />
                <textarea value={uploadData.mwIdea} onChange={e => setUploadData({...uploadData, mwIdea: e.target.value})} placeholder="MW Idea 思路拆解" className="w-full bg-[#F9F9F9] border border-gray-200 rounded-[12px] p-4 text-sm h-28 focus:border-[#Cfa76f] focus:bg-white outline-none resize-none transition-all"></textarea>
                <button onClick={handleUploadSubmit} disabled={isUploading || !selectedFile} className="w-full h-[44px] bg-[#333333] text-white rounded-[12px] font-medium hover:bg-[#Cfa76f] flex items-center justify-center gap-2 disabled:bg-gray-300 shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all">
                  {isUploading ? <><Loader2 size={16} className="animate-spin" /> 入库与 AI 分析中...</> : '确认入库'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function IdeaboardCard({ data, onClick, isVideo, isAdmin, onDelete }: any) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewTimerRef = useRef<number | null>(null);
  const isMediaVideo = isVideo(data.imageUrl);
  const visibleTags = data.tags?.slice(0, 4) || [];
  const gentleRotation = Math.max(-0.6, Math.min(0.6, Number(data.rotation) || 0));
  const decorationPosition = Math.max(24, Math.min(76, Number(data.decPosition) || 50));
  const decorationType = data.decoration === 'clip'
    ? 'clip'
    : data.decoration === 'tape'
      ? 'tape'
      : 'pin';

  const handleMouseEnter = () => {
    if (isMediaVideo && videoRef.current) {
      if (previewTimerRef.current) window.clearTimeout(previewTimerRef.current);
      videoRef.current.currentTime = 0; videoRef.current.play();
      previewTimerRef.current = window.setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }
        previewTimerRef.current = null;
      }, 5000);
    }
  };
  const handleMouseLeave = () => {
    if (previewTimerRef.current) {
      window.clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
    if (isMediaVideo && videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0; }
  };

  return (
    <div className="break-inside-avoid relative mb-6 pt-3">
      <motion.div className="relative group cursor-zoom-in transition-transform duration-300 ease-out hover:-translate-y-0.5" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onClick={onClick}>
        <div className="relative overflow-visible" style={{ transform: `rotate(${gentleRotation}deg)` }}>
          
          {isAdmin && (
            <button onClick={onDelete} className="absolute top-3 right-3 z-50 bg-red-500/90 text-white p-2 rounded-[8px] opacity-0 group-hover:opacity-100 transition-all hover:scale-105 shadow-sm">
              <Trash2 size={14} />
            </button>
          )}

          {decorationType === 'tape' && (
            <div className="pointer-events-none absolute -top-1.5 z-50 h-4 w-16 -translate-x-1/2 rotate-[-1.5deg] bg-[#e8e2d6]/65 mix-blend-multiply shadow-[0_2px_6px_rgba(0,0,0,0.035)]" style={{ left: `${decorationPosition}%` }} />
          )}
          {decorationType === 'pin' && (
            <div className="pointer-events-none absolute -top-1 z-50 h-3.5 w-3.5 -translate-x-1/2 rounded-full border border-white/60 bg-[#b9aa95] shadow-[0_3px_8px_rgba(0,0,0,0.10)]" style={{ left: `${decorationPosition}%` }} />
          )}
          {decorationType === 'clip' && (
            <div className="pointer-events-none absolute -top-2 z-50 h-7 w-3 -translate-x-1/2 rounded-full border-[1.5px] border-[#b8b3aa] bg-white/30 shadow-[0_3px_8px_rgba(0,0,0,0.06)]" style={{ left: `${decorationPosition}%` }} />
          )}

          <div className="relative overflow-hidden rounded-[12px] border border-black/[0.06] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-shadow duration-300 group-hover:shadow-[0_10px_34px_rgba(0,0,0,0.07)]">
            <div className="relative overflow-hidden rounded-t-[12px] bg-[#F9F9F9]">
	              {isMediaVideo ? (
	                <video ref={videoRef} src={data.imageUrl} muted playsInline preload="metadata" className="w-full h-auto grayscale-[6%] group-hover:grayscale-0 transition-all duration-500" />
	              ) : (
                <img src={data.imageUrl} loading="lazy" className="w-full h-auto grayscale-[6%] group-hover:grayscale-0 transition-all duration-500" />
              )}
              {isMediaVideo && (
                <span className="absolute bottom-2.5 right-2.5 rounded-full border border-white/60 bg-white/75 px-2 py-1 text-[9px] font-semibold leading-none tracking-widest text-gray-500 backdrop-blur-sm">
                  VIDEO
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 px-3 pt-3 pb-3.5">
              {visibleTags.map((t, i) => (
                <span key={i} className="max-w-full truncate rounded-full border border-black/[0.06] bg-[#F9F9F9] px-2.5 py-1 text-[10px] font-medium leading-none tracking-wide text-gray-500">
                  # {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
