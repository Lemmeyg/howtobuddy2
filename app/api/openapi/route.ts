import { NextResponse } from 'next/server'
import openapiSpec from '../openapi.json'

export async function GET() {
  return NextResponse.json(openapiSpec)
} 