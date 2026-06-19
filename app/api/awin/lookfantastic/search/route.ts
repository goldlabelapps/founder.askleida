import { GET as getAwin } from '../../get';

export async function GET(req: Request) {
  return getAwin(req);
}
