import prisma from '@/lib/db'
import {
  getAuthUser,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from '@/lib/api-utils'

// GET /api/receipts/download/[id] — Download receipt as PDF (redirects to HTML printable)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorizedResponse()
  if (user.role !== 'owner' && user.role !== 'admin') {
    return forbiddenResponse('Only owners and admins can download receipts')
  }

  try {
    const { id } = await params

    const receipt = await prisma.receipt.findFirst({
      where: { id, companyId: user.companyId },
    })

    if (!receipt) return errorResponse('Receipt not found', 404)

    // Redirect to the HTML printable version
    return Response.redirect(new URL(`/api/receipts/${id}/html`, request.url))
  } catch (error) {
    console.error('Error downloading receipt:', error)
    return errorResponse('Failed to download receipt', 500)
  }
}
