import { useState, FormEvent, useEffect, useCallback } from 'react'
import { trpcClient } from '../../../utils/api'
import { useRouter } from 'next/router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useDropzone } from 'react-dropzone'

import Image from 'next/image'
import * as Bs from 'react-icons/bs'

type TProps = {
  setPageIndex: React.Dispatch<React.SetStateAction<number>>
  article_id: string | null
  action_id: string | null
  navigateBack?: boolean
}
const UploadImageForm = ({
  setPageIndex,
  article_id,
  action_id,
  navigateBack,
}: TProps) => {
  const [articleImage, setArticleImage] = useState<string>('')
  const [files, setFiles] = useState<File[] | undefined>(undefined)

  const router = useRouter()

  const queryClient = useQueryClient()

  const { data: images } = useQuery(
    ['image.getAllRelatedImages', { article_id, action_id }],
    () =>
      trpcClient.image.getAllRelatedImages.query({
        article_id: article_id || null,
        action_id: action_id || null,
      }),
    {
      enabled: article_id ? true : false,
    }
  )

  const { mutate: createImage } = useMutation(
    (input: {
      name: string
      article_id: string
      action_id: string
      contentType: string
    }) => trpcClient.image.createPresignedURL.mutate(input),
    {
      onSuccess: async (data) => {
        setArticleImage('')
        setFiles(undefined)

        if (!files) return alert('No File')

        // fileds returned from S3 presigned URL
        const fileds: Record<string, unknown> = { ...data?.fields }
        const url: string | undefined = data?.url
        const fileData: Record<string, unknown> = {
          ...fileds,
          'Content-Type': files[0]?.type,
          file: files[0],
        }

        const formData = new FormData()
        for (const name in fileData) {
          const value = fileData[name]
          if (typeof value === 'string' || value instanceof Blob) {
            formData.append(name, value)
          }
        }
        if (!url) return alert('NO URL')

        fetch(url, {
          method: 'PUT',
          body: formData,
        })
          .then((res) => console.log(res))
          .catch((err) => console.log(err))

        await queryClient.invalidateQueries([
          'image.getAllRelatedImages',
          { article_id, action_id },
        ])
      },
    }
  )

  // Navigate user of the page if he has uploaded 8 images
  useEffect(() => {
    if (images?.length === 8) {
      router.push('/').catch(console.error)
      setPageIndex(0)
    }
  }, [images, setPageIndex, router])

  // Select image function to state
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // set Files to state
    setFiles(acceptedFiles)

    // Display image when selected
    const selectedImageArray = Array.from(acceptedFiles)
    const imagesArray = selectedImageArray.map((file) => {
      return URL.createObjectURL(file)
    })

    if (!imagesArray[0]) return

    setArticleImage(imagesArray[0])
  }, [])

  const { getRootProps, getInputProps } = useDropzone({ onDrop })

  const handleUploadImage = (e: FormEvent<HTMLElement>) => {
    e.preventDefault()

    if (
      !files ||
      article_id === null ||
      article_id === undefined ||
      action_id === null ||
      action_id === undefined
    )
      return console.log('empty')

    createImage({
      article_id,
      action_id,
      name: files[0]?.name || '',
      contentType: files[0]?.type || 'image/jpeg',
    })
  }

  // Display empty slots if array of images.length is < 8
  const insertPlaceholderImages = (article_images: typeof images) => {
    if (article_images?.length === 0) {
      const images = new Array(8).fill('Placeholder image')
      return images as string[]
    } else {
      // Find the max length and images array
      const diff = 8 - (article_images?.length || 0)

      const filled_images = article_images?.concat(
        new Array(diff).fill('placeholder image')
      )
      return filled_images
    }
  }

  const image_slots = insertPlaceholderImages(images)

  return (
    <form
      onSubmit={handleUploadImage}
      className='min-h-[484px] w-[550px] rounded-xl bg-white p-10 drop-shadow-2xl'
    >
      <h1 className='w-full text-center text-2xl font-bold text-gray-800'>
        Dodaj dodaj sliku
      </h1>

      <fieldset
        {...getRootProps()}
        className='mt-2 h-full rounded-xl border-2 border-gray-800 text-lg font-semibold text-gray-800'
      >
        <input {...getInputProps()} />
        <div className='flex h-[300px] w-full cursor-pointer items-center justify-center'>
          <p>Povuci sliku ili klikni ovdije...</p>
        </div>
      </fieldset>

      <div className='my-4 flex h-full w-full cursor-pointer items-center justify-center'>
        {/* eslint-disable-next-line */}
        <img src={articleImage || ''} />
      </div>

      <section className='mt-4 flex w-full items-center justify-evenly'>
        <button
          disabled={!files?.length}
          onSubmit={handleUploadImage}
          className='w-4/5 max-w-[200px] rounded-xl bg-gray-800 p-4 text-center text-xl font-semibold text-gray-300 hover:bg-gray-700 disabled:bg-gray-600'
        >
          Dodaj
        </button>
        {/* Used in update images modal */}
        {navigateBack && (
          <button
            onClick={() => setPageIndex(0)}
            className='w-4/5 max-w-[200px] rounded-xl bg-gray-800 p-4 text-center text-xl font-semibold text-gray-300 hover:bg-gray-700 disabled:bg-gray-600'
          >
            <Bs.BsArrowRight className='h-6 w-6 rotate-180' />
          </button>
        )}
      </section>

      <div className='mt-5 grid w-full grid-cols-8 grid-rows-1 gap-1 overflow-x-auto'>
        {image_slots?.map((image) => {
          if (typeof image !== 'string')
            return (
              <div
                key={Math.random().toString()}
                className='flex h-full w-full items-center justify-center'
              >
                <Image
                  alt='article image'
                  src={image.access_url || ''}
                  width={300}
                  height={300}
                />
              </div>
            )
          return (
            <div
              key={Math.random().toString()}
              className='mih-h-1 relative z-20 flex h-full w-full animate-pulse items-center justify-center bg-gray-400'
            ></div>
          )
        })}
      </div>
    </form>
  )
}

export default UploadImageForm
