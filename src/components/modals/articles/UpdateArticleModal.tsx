import { ChangeEvent, FormEvent } from 'react'
import {
  Article,
  Image,
  CategoriesOnArticle,
  Category,
  ArticleAction,
} from '@prisma/client'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { trpcClient } from '../../../utils/api'

import FieldSet from '../../Fieldset'
import Textarea from '../../Textarea'
import Select from 'react-select'
import { Dialog } from '@headlessui/react'
import * as Ai from 'react-icons/ai'

type TArticle = Article & {
  image: Image[]
  brand: {
    name: string
  } | null
  categories: (CategoriesOnArticle & {
    category: Category
  })[]
  action: ArticleAction | null
}

type TProps = {
  article: TArticle
  isOpen: boolean
  setArticle: React.Dispatch<React.SetStateAction<TArticle>>
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const UpdateArticleModal = ({
  isOpen,
  article,
  setIsOpen,
  setArticle,
}: TProps) => {
  const queryClient = useQueryClient()

  const { data: brands } = useQuery(['brand.getAllBrands'], () =>
    trpcClient.brand.getAllBrands.query()
  )

  const brand_options =
    brands?.map((brand) => ({
      label: brand.name,
      value: brand.id,
    })) || []

  const value = brand_options.find(
    (option) => option.label === article?.brand?.name
  )

  const { mutate: updateArticle } = useMutation(
    (input: {
      id: string
      name: string
      description: string
      base_price: number
      brand_id: string | null
    }) => trpcClient.article.updateArticle.mutate(input),
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries(['articles.getAllArticles'])
        setArticle({} as TArticle)
        setIsOpen(false)
      },
    }
  )

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setArticle((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = (e: FormEvent<HTMLElement>) => {
    e.preventDefault()

    // Check for selected brand
    const brand = brand_options.find(
      (option) => option.label === article?.brand?.name
    )

    updateArticle({
      ...article,
      ...(brand ? { brand_id: brand?.value } : {}), // optionaly send brand_id
    })
  }

  return (
    <Dialog
      open={isOpen}
      onClose={() => {
        setIsOpen(false)
        setArticle({} as TArticle)
      }}
    >
      <Dialog.Panel className='fixed inset-0'>
        <div
          className='absolute h-full w-full bg-black/30'
          onClick={() => {
            setIsOpen(false)
            setArticle({} as TArticle)
          }}
        />

        <main className='flex h-full min-h-screen w-full flex-col items-center justify-center'>
          <form
            onSubmit={handleSubmit}
            className='flex min-h-[584px] w-[450px] flex-col justify-evenly rounded-xl bg-white p-10 drop-shadow-2xl'
          >
            <h1 className='w-full text-center text-2xl font-bold text-gray-800'>
              Izmjeni artikal
            </h1>
            <FieldSet
              type='text'
              label='Naziv'
              name='name'
              value={article.name}
              onChange={handleChange}
            />
            <Textarea
              rows={4}
              id='message'
              label=' Opis artikla'
              value={article.description}
              onChange={handleChange}
              name='description'
              placeholder='Opišite artikal'
            />
            <FieldSet
              value={article.base_price}
              onChange={handleChange}
              name='base_price'
              label='Cijena'
              type='number'
            />
            <Select
              options={brand_options}
              placeholder='Odaberi brend'
              value={value || null}
              onChange={(option) =>
                option &&
                setArticle({ ...article, brand: { name: option.label } })
              }
            />
            <section className='mt-5 flex w-full items-center justify-center'>
              <button
                onSubmit={handleSubmit}
                className='w-4/5 rounded-xl bg-gray-800 p-4 text-center text-xl font-semibold text-gray-300 hover:bg-gray-700 disabled:bg-gray-600'
              >
                Sačuvaj
              </button>
            </section>
            <Ai.AiFillCloseCircle
              onClick={() => {
                setIsOpen(false)
                setArticle({} as TArticle)
              }}
              className='absolute top-4 right-4 h-8 w-8 cursor-pointer rounded-full bg-gray-600 text-white hover:bg-gray-800'
            />
          </form>
        </main>
      </Dialog.Panel>
    </Dialog>
  )
}

export default UpdateArticleModal
