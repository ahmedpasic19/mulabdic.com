import { useRouter } from 'next/router'
import { trpcClient } from '../../utils/api'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'react-toastify'

import ImageCarousel from '../../components/layout/ImageCarousel'
import Image from 'next/image'

import { parseTextFormat, reverseFormatContent } from '../../utils/formatText'

const ArticlePage = () => {
  const router = useRouter()
  const { article_id } = router.query

  const articleId = typeof article_id === 'string' ? article_id : ''

  const { data: article } = useQuery(['article', { id: article_id }], () =>
    trpcClient.article.getArticle.query({ article_id: articleId })
  )

  const { data: artilce_images } = useQuery(
    ['image.getAllArticleImges', { article_id: articleId, action_id: null }],
    () =>
      trpcClient.image.getAllRelatedImages.query({
        article_id: articleId,
        action_id: null,
      }),
    {
      enabled: articleId ? true : false,
    }
  )

  const image_uls = artilce_images?.map((image) => image.access_url || '') || []

  const apiString = `${article?.description || ''}`
  const formattedString = apiString.replace(/&lt;br&gt;/g, '<br/>')

  const descriptionValues = reverseFormatContent(article?.description || '')

  const copyToClipboard = async () => {
    await navigator?.clipboard.writeText('+387 62 671 327')
    toast.info('Kopiran br. telefona', {
      position: 'top-center',
      hideProgressBar: true,
      delay: 500,
    })
  }

  return (
    <div className='flex h-full min-h-screen w-full flex-col pb-5 xl:px-20'>
      <div className='flex w-full flex-col items-center'>
        {/* Images and detail */}
        <section className='flex w-full flex-col sm:flex-row'>
          <div className='inset-0 flex w-full flex-col items-center justify-center overflow-hidden rounded-sm border-2 border-gray-100 sm:max-w-[50%]'>
            {/* Selected image preveiw */}
            <div className='flex h-96 w-full items-center justify-center overflow-hidden'>
              <ImageCarousel images={image_uls} />
            </div>
            {/* List of all article images */}
            <div className='mt-5 flex w-full gap-2 overflow-x-auto bg-white shadow-md'>
              {image_uls?.map((image) => (
                <div
                  key={Math.random().toString()}
                  className='flex h-28 w-28 items-center justify-center overflow-hidden'
                >
                  <Image
                    alt='article image'
                    src={image}
                    width={300}
                    height={300}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className='jucenter flex h-full w-full flex-col items-center sm:max-w-[50%]'>
            <h2 className='w-full bg-gray-600 p-5 text-center text-2xl font-semibold text-white'>
              {article?.name}
            </h2>
            <h1 className='p-10 text-[4em] font-extrabold tracking-tight text-gray-600'>
              {article?.base_price}KM
            </h1>
            {article?.warranty && (
              <div className='flex w-full items-center justify-center'>
                <h1 className='w-full bg-gray-600 py-2 text-center text-white'>
                  <b>Garancija: {article?.warranty}</b>
                </h1>
              </div>
            )}
            <section className='mt-4 flex h-full w-full flex-col items-center px-5 sm:flex-row sm:items-end'>
              <button
                onClick={copyToClipboard}
                className='my-2 flex w-4/5 justify-between rounded-md bg-blue-600 p-2 text-lg font-bold text-white sm:mx-2 sm:w-3/5'
              >
                <label>Viber:</label> <p>+387 62 671 327</p>
              </button>
              <a
                className='my-2 w-4/5 rounded-md bg-gray-600 p-2 text-center text-lg font-bold text-white sm:mx-2 sm:w-3/5'
                href='https://profihoby.olx.ba/aktivni'
                rel='noreferrer'
                target='_blank'
              >
                profihoby.olx.ba
              </a>
            </section>
          </div>
        </section>

        {/* Article short description */}
        <section className='mt-4 flex w-full max-w-[80%] flex-col items-center'>
          <h2 className='mb-2 text-xl font-bold'>Opis artikla</h2>
          <p className='w-[90%] whitespace-pre-line break-words text-base font-normal text-gray-600'>
            {parseTextFormat(article?.short_description || '')}
          </p>
        </section>

        {/* Article description */}
        <section className='mt-4 flex w-full max-w-[80%] flex-col items-center'>
          {article?.description?.includes('&lt;br&gt;') ? (
            <div dangerouslySetInnerHTML={{ __html: formattedString }} />
          ) : (
            descriptionValues?.map((att) => (
              <li key={Math.random()} className='flex w-full justify-between'>
                <label className='w-full text-lg font-bold text-gray-800'>
                  {att.title}
                </label>
                <p className='w-full max-w-5xl truncate whitespace-pre-line text-end text-lg text-gray-600'>
                  {att.value}
                </p>
              </li>
            ))
          )}
        </section>

        {article?.attributes?.length ? (
          <section className='mt-2 w-full sm:w-4/5'>
            <h2 className='w-full border-t-2 border-gray-50 text-center text-xl font-bold'></h2>
            <ul className='w-full px-4'>
              {article?.attributes?.map((att) => (
                <li key={Math.random()} className='flex w-full justify-between'>
                  <label className='w-full text-lg font-bold text-gray-800'>
                    {att.title}
                  </label>
                  <p className='w-full max-w-5xl truncate whitespace-pre-line text-end text-lg text-gray-600'>
                    {att.text}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  )
}

export default ArticlePage
