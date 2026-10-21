export async function POST() {
  return Response.json(
    { error: "Esta operação foi desativada." },
    { status: 410 },
  );
}
export const GET = POST;
