"use client"
import { HydrationBoundary } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { id } from "date-fns/locale";
import{
    ResizablePanel,
    ResizableHandle,
    ResizablePanelGroup} from "@/components/ui/resizable"
import { MessagesContainer } from "../components/messages-container";
import { Suspense, useState } from "react";
import { Fragment } from "@/generated/prisma";
import { ProjectHeader } from "../components/project-header";
import { FragmentWeb } from "../components/fragment-web";


interface Props{
    projectId: string
}

export const ProjectView =({projectId}:Props)=>{
    const trpc = useTRPC();
   
    const [activeFragment , setActiveFragment] = useState<Fragment | null>(null);
   
        
    


   return(
    <div className="h-screen">
        <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={35}
            minSize={20}
            className="flex flex-col min-h-0">
                <Suspense fallback={<p> Loading Project </p>}>
                    <ProjectHeader projectId={projectId}/>
                </Suspense>
                <Suspense fallback={<p>loading messages..</p>}>
            <MessagesContainer 
            projectId={projectId}
            activeFragment = {activeFragment}
            setActiveFragment={setActiveFragment}
            />
            </Suspense>
        {/* {JSON.stringify(project)} */}
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={65}
        minSize={50}>
            {!!activeFragment && <FragmentWeb data={activeFragment}/> }
        {/* {JSON.stringify(messages,null,2)} */}
        TODO:privew
        </ResizablePanel>
        </ResizablePanelGroup>
        

    </div>
   )
};