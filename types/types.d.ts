import { JsonValue } from "@prisma/client/runtime/library"

export type LoginUser = {
  email: string
  password: string
}

export type PostUser = {
  email: string
  name: string
  year: string
  password: string
}

export type User = {
  id: string
  email: string
  name: string
  year: string
  password: string
}

export type PatchUser = Partial<User>

export type PostBoard = {
  name: string
  userId: string
}

export type Board = {
  id: string
  name: string
  userId: string
}

export type PatchBoard = Partial<Board>

export type PostCard = {
  name: string
  description: string
  date: string
  time: string
  tags: JsonValue
  boardId: string
}

export type Card = {
  id: string
  name: string
  description: string
  date: string
  time: string
  tags: null
  boardId: string
}

export type PatchCard = Partial<Card>
