import { NextRequest } from 'next/server';
import { success, badRequest, notFound } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { addressBookRepository } from '@/repositories/address-book.repository';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const entry = await addressBookRepository.findById(params.id);
    if (!entry) {
      return notFound('Address book entry not found');
    }

    if (entry.userId !== ctx.userId) {
      return badRequest('You can only delete your own address book entries');
    }

    await addressBookRepository.delete(params.id);

    return success({ message: 'Address book entry deleted' });
  });
}
