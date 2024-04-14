import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { sign } from "hono/jwt";
import { signininput, signupinput } from '@jai-redhawk/firstblog-common';

export const userRoutes= new Hono<{
    Bindings: {
        DATABASE_URL: string,
        JWT_SECRET: string
    }
}>(); 

userRoutes.post('/signup', async (c)=>{
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    console.log("e1");
    const body= await c.req.json();
    const { success } = signupinput.safeParse(body);
    if(!success){
        c.status(403);
        return c.json({
            error: "error while signing up"
        })
    }
    console.log("e2");
    try{
        const user= await prisma.user.create({
            data: {
                name: body.name,
                email: body.email,
                password: body.password,
            }
        })
        const token= await sign({id: user.id}, c.env.JWT_SECRET)
        return c.json({
            jwt: token
        });
    }
    catch(error){
        c.status(403);
        console.error("error:", error);
        
        return c.json({
            error: "error while signing up"
        })
    }
});

userRoutes.post('/signin', async (c)=>{
    const prisma= new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const body= await c.req.json();
    const { success } = signininput.safeParse(body);
    if(!success){
        c.status(403);
        return c.json({
            error: "error while signing up"
        })
    }
    try{
        const user= await prisma.user.findUnique({
            where: {
                email: body.email,
                password: body.password,
            },
        })
        if(!user){
            c.status(403);
            return c.json({erro: "user not found"});
        }
        const jwt= await sign({id: user.id}, c.env.JWT_SECRET);
        return c.json({
            jwt
        })
    }
    catch{
        c.status(411);
        return c.json({error: "error while signing in"});
    }
});

