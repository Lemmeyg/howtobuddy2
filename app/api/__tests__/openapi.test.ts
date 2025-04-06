import { GET } from '../openapi/route'
import { NextResponse } from 'next/server'

describe('OpenAPI Route', () => {
  it('returns OpenAPI specification', async () => {
    const response = await GET()
    expect(response).toBeInstanceOf(NextResponse)
    
    const data = await response.json()
    expect(data).toHaveProperty('openapi', '3.0.0')
    expect(data).toHaveProperty('info')
    expect(data).toHaveProperty('paths')
    expect(data).toHaveProperty('components')
  })

  it('includes all required API endpoints', async () => {
    const response = await GET()
    const data = await response.json()
    
    expect(data.paths).toHaveProperty('/api/documents')
    expect(data.paths).toHaveProperty('/api/documents/{id}')
    expect(data.paths).toHaveProperty('/api/templates')
    expect(data.paths).toHaveProperty('/api/templates/{id}')
  })

  it('includes security schemes', async () => {
    const response = await GET()
    const data = await response.json()
    
    expect(data.components.securitySchemes).toHaveProperty('bearerAuth')
    expect(data.components.securitySchemes.bearerAuth).toEqual({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT'
    })
  })
}) 