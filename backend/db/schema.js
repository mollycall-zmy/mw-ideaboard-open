import { pgTable, serial, text, json, real, timestamp, varchar } from 'drizzle-orm/pg-core';

// Ideaboard inspiration item schema.
export const ideaboard = pgTable('ideaboard', {
  // 1. 唯一编号
  id: serial('id').primaryKey(),
  
  // 2. 基础视觉库
  imageUrl: text('image_url').notNull(),         // 图片地址
  aiTags: json('ai_tags').default('[]'),         // AI 视觉标签 (存成数组)
  
  // 3. Notes and source metadata
  sourceLink: text('source_link'),               // 来源链接
  mwIdea: text('mw_idea'),                       // idea notes
  
  // 4. 物理引擎固化 (保存随机倾斜和图钉状态，让手账感保持固定)
  rotation: real('rotation').notNull(),          // 倾斜角度
  decoration: varchar('decoration', { length: 50 }).notNull(), // 装饰物类型 (tape, pin-gold, pin-dark)
  decPosition: real('dec_position').notNull(),   // 装饰物位置
  
  // 5. 时间维度
  createdAt: timestamp('created_at').defaultNow() // 自动记录上传时间
});
