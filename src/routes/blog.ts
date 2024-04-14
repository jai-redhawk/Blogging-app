import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { sign, verify } from "hono/jwt";
import { createbloginput, updatebloginput } from "@jai-redhawk/firstblog-common";
export const blogRoutes= new Hono<{
    Bindings: {
        DATABASE_URL: string
        JWT_SECRET: string
    },
    Variables: {
        userId : string
    }
}>();

blogRoutes.all('/*', async(c,next)=>{
    const auth= c.req.header('authentication')||" ";
    try{
        const user= await verify(auth, c.env.JWT_SECRET);
        if(user){
            c.set("userId", user.id);
            await next();
        }
        else{
            c.status(403);
            return c.json({
                error: "user doesn't exist"
            })
        }
    }
    catch{
        c.status(411);
        return c.json({
            error: "user haven't signed up"
        })
    }
});

blogRoutes.post('/', async(c)=>{
    const prisma= new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());
    const authorId= c.get("userId");
    const body= await c.req.json();
    const { success } = createbloginput.safeParse(body);
    if(!success){
        c.status(403);
        return c.json({
            error: "error while signing up"
        })
    }
    try{
        const blog= await prisma.blog.create({
            data: {
                authorId: authorId,
                title: body.title,
                content: body.content,
            }
        });
        return c.json({
            id: blog.id
        })

    }
    catch{
        c.status(411);
        return c.json({
            error: "page not found"
        })
    }
});
blogRoutes.put('/blog', async(c)=>{
    const prisma= new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());
    const authorId= c.get("userId");
    const body= await c.req.json();
    const { success } = updatebloginput.safeParse(body);
    if(!success){
        c.status(403);
        return c.json({
            error: "error while signing up"
        })
    }
    if(body.authorId==authorId){
        try{
            const blog= await prisma.blog.update({
                where: {
                    id: body.id
                },
                data:{
                    title: body.title,
                    content: body.content,
                }
            })
            return c.json({
                id: blog.id,
            })
        }
        catch{
            c.status(411);
            return c.json({
                error: "user doesn't exist"
            })
        }
    }
    else{
        c.status(403);
        return c.json({
            error: "Blog doesn't exist"
        })
    }
    })

    blogRoutes.get('/id/:id', async(c)=>{
        const id= c.req.param("id");
        const prisma= new PrismaClient({
            datasourceUrl: c.env.DATABASE_URL,
        }).$extends(withAccelerate());
        try{
        const blog= await prisma.blog.findFirst({
            where: {
                id: id,
            }
        })
        return c.json({
                blog,
            })
        }
        catch{
            c.status(411);
            return c.json({
                error: "couldn't find the blog"
            })
        }
    });

    blogRoutes.get('/bulk', async(c)=>{
        const prisma= new PrismaClient({
            datasourceUrl: c.env.DATABASE_URL,
        }).$extends(withAccelerate());

        try{const blogs= await prisma.blog.findMany();
        //add pagination
        return c.json({
            blogs,
        })
        }
        catch{
            c.status(411);
            c.json({
                error: "no blogs available"
            })
        }
    })