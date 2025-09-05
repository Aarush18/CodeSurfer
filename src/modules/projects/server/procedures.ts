
import { inngest } from "@/inngest/client";
import prisma from "@/lib/db";
import { protectedProcedure, createTRPCRouter } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import {generateSlug} from "random-word-slugs"
import z from "zod";

export const projectsRouter = createTRPCRouter({
    getOne: protectedProcedure
    .input(z.object({
        id:z.string().min(1,{message:"id is required"})
    }))
    .query(async({input , ctx})=>{
        
        const existingProjects=await prisma.project.findUnique({
                where:{
                    id:input.id,
                    userId: ctx.auth.userId,
                },
                //  // START OF THE FIX: Add this 'include' block
                //  include: {
                //     message: {
                //         orderBy: {
                //             createdAt: "asc", // Order messages from oldest to newest
                //         }
                //     }
                // }
                // // END OF THE FIX
                
                })
                if(!existingProjects){
                    throw new TRPCError({
                        code:"NOT_FOUND",
                        message:"Project not found"
                    })
                }
    
        return existingProjects;
    
    }),
    getMany: protectedProcedure
    .query(async({ctx})=>{
        const projects=await prisma.project.findMany(
            {
                where:{
                    userId: ctx.auth.userId
                },
                orderBy:{
                    
                    updatedAt:"desc",
                },
                // include:{
                //     fragment:true,
                // }
            }
        );
        return projects;
    
    }),
    create: protectedProcedure
    .input(
        z.object({
            value:z.string()
            .min(1,{message:"value is required"})
            .max(10000,{message:"value is too long"})
            
        }),
    )
    .mutation(async({input , ctx})=>{
        const createdProject=await prisma.project.create({
            data:{
                userId: ctx.auth.userId ,
                name:generateSlug(2,{
                    format:"kebab"
                }),
                message:{
                    create:{
                        content:input.value,
                        role:"USER",
                        type:"RESULT",
                    }
                }
                
            },
        });
        

          
        await inngest.send({
                name:"code-agent/run",
                data:{
                  value:input.value,
                  projectId:createdProject.id
                }
              })

              return createdProject;

    }),
});