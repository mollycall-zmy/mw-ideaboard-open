import fetch from 'node-fetch';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { ideaboard } from './db/schema.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

process.on('uncaughtException', (err) => console.error('\n💥 程序崩溃:', err));
process.on('unhandledRejection', (err) => console.error('\n💥 异步任务失败:', err));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use('/uploads', express.static(uploadDir, { maxAge: '30d' }));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

const queryClient = postgres(process.env.DATABASE_URL);
const db = drizzle(queryClient);

queryClient`SELECT 1`.then(() => console.log('✅ 数据库：连接稳定！'))
  .catch(err => console.error('\n❌ 数据库连接失败:', err.message));

function requireAdmin(req, res, next) {
  const expectedKey = process.env.MW_ADMIN_KEY;
  const providedKey = req.get('x-mw-admin-key');

  if (!expectedKey || providedKey !== expectedKey) {
    return res.status(401).json({ error: '主理人权限已失效，请重新验证' });
  }

  next();
}

// ==========================================
// 核心：调用 MiMo 视觉模型 (加入暴力兼容解析)
// ==========================================
async function fetchAITags(base64Image, mimeType) {
  const apiKey = process.env.MIMO_API_KEY;
  const baseUrl = process.env.MIMO_BASE_URL;
  const modelName = process.env.MIMO_MODEL;

  if (!apiKey) {
    console.log("⚠️ 未检测到 API KEY，跳过 AI 分析。");
    return []; 
  }

  console.log(`\n🧠 正在呼叫 MiMo 大模型 (${modelName})...`);
  
  const requestPayload = {
    model: modelName,
    messages: [
      {
        role: "user",
        content: [
          { 
            type: "text", 
            text: "作为品牌营销与视觉设计专家，请分析这张图片并提取3-5个最精准的核心标签。标签优先包含：1. 画面中出现的具体知名品牌、IP或物体（如：麦当劳、多邻国、苹果等）；2. 核心的视觉风格或情绪氛围（如：赛博朋克、极简主义、搞笑、荒诞）。请直接返回纯文本的JSON数组，如：[\"麦当劳\", \"极简主义\"]，绝对不要任何解释或其他多余文字。" 
          },
          { 
            type: "image_url", 
            image_url: { url: `data:${mimeType};base64,${base64Image}` } 
          }
        ]
      }
    ],
    // 稍微放大一点字数限制，防止话没说完被掐断
    max_tokens: 300
  };

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestPayload)
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("\n❌ MiMo 报错啦:", data.error.message);
      return [];
    }

    if (data.choices && data.choices[0].message) {
      let rawContent = data.choices[0].message.content.trim();
      console.log("📝 MiMo 原始回复内容:", rawContent); // 打印出来看看它到底说了什么废话

      // 第一步：尝试温柔地清理 Markdown 符号
      let cleanContent = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();

      try {
        // 尝试标准解析
        let parsed = JSON.parse(cleanContent);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (parseError) {
        console.log("⚠️ 实习生(AI)没按格式给 JSON，启动暴力提取模式...");
        // 暴力破解：把所有的括号、引号全都删掉，然后按照逗号切分成数组
        let fallbackTags = cleanContent
          .replace(/[\[\]"']/g, '') // 删掉 [] 和 "" 和 ''
          .split(/[,，、\n]/)        // 按照中英文逗号、顿号、换行符切分
          .map(t => t.trim())        // 去掉空格
          .filter(t => t.length > 0); // 过滤掉空字符串

        if (fallbackTags.length > 0) {
          console.log("✅ 暴力提取成功:", fallbackTags);
          return fallbackTags;
        }
      }
    }
    return [];
  } catch (error) {
    console.error("❌ AI 调用彻底失败:", error.message);
    return [];
  }
}

app.get('/api/images', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const images = await db.select().from(ideaboard);
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: '获取数据失败' });
  }
});

app.post('/api/images', requireAdmin, upload.single('file'), async (req, res) => {
  try {
    const { sourceLink, mwIdea, aiTags, rotation, decoration, decPosition } = req.body;
    let finalImageUrl = '';
    
    let manualTags = aiTags ? JSON.parse(aiTags) : [];
    let finalTags = [];

    if (req.file) {
      finalImageUrl = `/uploads/${req.file.filename}`;
      const fileBuffer = fs.readFileSync(req.file.path);
      const base64Str = fileBuffer.toString('base64');
      
      if (!req.file.mimetype.startsWith('video/')) {
         const aiGeneratedTags = await fetchAITags(base64Str, req.file.mimetype);
         finalTags = [...new Set([...manualTags, ...aiGeneratedTags])];
      } else {
         finalTags = manualTags;
      }
    } else if (req.body.imageUrl) {
      finalImageUrl = req.body.imageUrl;
      finalTags = manualTags;
    } else {
      return res.status(400).json({ error: '必须提供图片文件' });
    }

    if (finalTags.length === 0) finalTags = ["未分类"];

    const newImage = await db.insert(ideaboard).values({
      imageUrl: finalImageUrl,
      aiTags: JSON.stringify(finalTags), 
      sourceLink: sourceLink || '',
      mwIdea: mwIdea || '',
      rotation: Number(rotation),
      decoration,
      decPosition: Number(decPosition)
    }).returning();

    res.json(newImage[0]);
  } catch (error) {
    res.status(500).json({ error: '保存失败: ' + error.message });
  }
});

app.delete('/api/images/:id', requireAdmin, async (req, res) => {
  try {
    await db.delete(ideaboard).where(eq(ideaboard.id, Number(req.params.id)));
    res.json({ message: '已删除' });
  } catch (error) {
    res.status(500).json({ error: '删除失败' });
  }
});

app.patch('/api/images/:id', requireAdmin, upload.single('file'), async (req, res) => {
  try {
    const { mwIdea, aiTags, sourceLink } = req.body;
    const updateData = {};
    if (mwIdea !== undefined) updateData.mwIdea = mwIdea;
    if (aiTags !== undefined) updateData.aiTags = JSON.parse(aiTags);
    if (sourceLink !== undefined) updateData.sourceLink = sourceLink;
    if (req.file) updateData.imageUrl = `/uploads/${req.file.filename}`;
    
    const updated = await db.update(ideaboard).set(updateData).where(eq(ideaboard.id, Number(req.params.id))).returning();
    res.json(updated[0]);
  } catch (error) {
    res.status(500).json({ error: '更新失败' });
  }
});

const PORT = 3000;
const server = app.listen(PORT, () => {
  console.log(`\n======================================`);
  console.log(`🚀 MW 后端管家已上线！端口: ${PORT}`);
  console.log(`🧠 AI 接口已待命 (暴力防崩溃模式)`);
  console.log(`======================================\n`);
});
