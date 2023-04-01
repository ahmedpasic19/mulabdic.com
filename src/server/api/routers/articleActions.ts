import { z } from 'zod'

import { createTRPCRouter, adminProcedure, publicProcedure } from '../trpc'

import AWS from 'aws-sdk'
import { env } from '../../../env/server.mjs'

const TTArticle = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  base_price: z.number(),
})

const BUCKET_REGION = env.BUCKET_REGION
const BUCKET_NAME = env.BUCKET_NAME
const SECRET_ACCES_KEY = env.SECRET_ACCES_KEY
const ACCESS_KEY = env.ACCESS_KEY

const s3 = new AWS.S3({
  region: BUCKET_REGION,
  accessKeyId: ACCESS_KEY,
  secretAccessKey: SECRET_ACCES_KEY,
})

export const articleActionRouter = createTRPCRouter({
  createArticleAction: adminProcedure
    .input(
      z.object({
        title: z.string(),
        discount: z.number(),
        description: z.optional(z.string()),
        date: z.date().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const new_article_action = await ctx.prisma.articleAction.create({
        data: {
          discount: input.discount,
          title: input.title,
          date: input.date,
          description: input.description,
        },
      })

      return new_article_action
    }),
  updateArticleAction: adminProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string(),
        discount: z.number(),
        description: z.string().nullable(),
        articles: z.array(TTArticle),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const updated_article_action = await ctx.prisma.articleAction.update({
        where: {
          id: input.id,
        },
        data: {
          discount: input.discount,
          title: input.title,
          description: input.description,
          articles: {
            set: input.articles.map(({ id }) => ({ id })),
          },
        },
      })

      return updated_article_action
    }),
  deleteArticleAction: adminProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const deleted_article_action = await ctx.prisma.articleAction.delete({
        where: {
          id: input.id,
        },
      })

      return deleted_article_action
    }),

  getAllArticleActions: publicProcedure.query(async ({ ctx }) => {
    const all_actions = await ctx.prisma.articleAction.findMany({
      include: { image: true },
    })

    // Assigning an accessURL from S3
    const actions_with_images = all_actions.map((action) => {
      const extended_images = action.image.map((image) => ({
        ...image,
        url: s3.getSignedUrl('getObject', {
          Bucket: BUCKET_NAME,
          Key: image.image,
        }),
      }))

      return { ...action, image: extended_images }
    })

    return actions_with_images
  }),

  getArticleAction: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const article_action = await ctx.prisma.articleAction.findUnique({
        where: { id: input.id },
      })
      return article_action
    }),
})
