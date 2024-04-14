import { Hono } from 'hono'
import { userRoutes } from './routes/user';
import { blogRoutes } from './routes/blog';
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.route('/api/v1/user', userRoutes);
app.route('/api/v1/blog', blogRoutes);


export default app
