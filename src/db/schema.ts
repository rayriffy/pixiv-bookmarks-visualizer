import { int, text, sqliteTable, blob, real, integer } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

export const illustsTable = sqliteTable('illusts', {
  id: int('id').primaryKey().notNull().unique(),
  title: text('title').notNull(),
  type: text('type').notNull(),
  caption: text('caption').notNull(),
  create_date: text('create_date').notNull(),
  page_count: int('page_count').notNull(),
  width: int('width').notNull(),
  height: int('height').notNull(),
  sanity_level: int('sanity_level').notNull(),
  total_view: int('total_view').notNull(),
  total_bookmarks: int('total_bookmarks').notNull(),
  is_bookmarked: integer('is_bookmarked', { mode: 'boolean' }).notNull(),
  visible: integer('visible', { mode: 'boolean' }).notNull(),
  x_restrict: int('x_restrict').notNull(),
  is_muted: integer('is_muted', { mode: 'boolean' }).notNull(),
  total_comments: int('total_comments').notNull().default(0),
  illust_ai_type: int('illust_ai_type').notNull(),
  illust_book_style: int('illust_book_style').notNull(),
  restrict: int('restrict').notNull(),
  bookmark_private: integer('bookmark_private', { mode: 'boolean' }).notNull(),
  // Store JSON strings for complex nested objects
  image_urls: text('image_urls').notNull(), // JSON string
  meta_single_page: text('meta_single_page').notNull(), // JSON string
  meta_pages: text('meta_pages').notNull(), // JSON string
  tools: text('tools').notNull(), // JSON string of array
  url: text('url'),
})

export const usersTable = sqliteTable('users', {
  id: int('id').primaryKey().notNull().unique(),
  name: text('name').notNull(),
  account: text('account').notNull(),
  profile_image_urls: text('profile_image_urls').notNull(), // JSON string
  is_followed: integer('is_followed', { mode: 'boolean' }),
})

export const tagsTable = sqliteTable('tags', {
  id: int('id').primaryKey().notNull().unique(),
  name: text('name').notNull().unique(),
  translated_name: text('translated_name'),
})

export const illustTagsTable = sqliteTable('illust_tags', {
  id: int('id').primaryKey().notNull().unique(),
  illust_id: int('illust_id').notNull().references(() => illustsTable.id),
  tag_id: int('tag_id').notNull().references(() => tagsTable.id),
})

export const illustUsersTable = sqliteTable('illust_users', {
  id: int('id').primaryKey().notNull().unique(), 
  illust_id: int('illust_id').notNull().references(() => illustsTable.id),
  user_id: int('user_id').notNull().references(() => usersTable.id),
})

// Relations
export const illustsRelations = relations(illustsTable, ({ many }) => ({
  tags: many(illustTagsTable),
  users: many(illustUsersTable),
}))

export const usersRelations = relations(usersTable, ({ many }) => ({
  illusts: many(illustUsersTable),
}))

export const tagsRelations = relations(tagsTable, ({ many }) => ({
  illusts: many(illustTagsTable),
}))

export const illustTagsRelations = relations(illustTagsTable, ({ one }) => ({
  illust: one(illustsTable, {
    fields: [illustTagsTable.illust_id],
    references: [illustsTable.id],
  }),
  tag: one(tagsTable, {
    fields: [illustTagsTable.tag_id],
    references: [tagsTable.id],
  }),
}))

export const illustUsersRelations = relations(illustUsersTable, ({ one }) => ({
  illust: one(illustsTable, {
    fields: [illustUsersTable.illust_id],
    references: [illustsTable.id],
  }),
  user: one(usersTable, {
    fields: [illustUsersTable.user_id],
    references: [usersTable.id],
  }),
}))
