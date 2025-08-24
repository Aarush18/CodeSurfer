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
import { Suspense } from "react";


interface Props{
    projectId: string
}

export const ProjectView =({projectId}:Props)=>{
    const trpc = useTRPC();
   
   
        
    


   return(
    <div className="h-screen">
        <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={35}
            minSize={20}
            className="flex flex-col min-h-0">
                <Suspense fallback={<p>loading messages..</p>}>
            <MessagesContainer projectId={projectId}/>
            </Suspense>
        {/* {JSON.stringify(project)} */}
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={65}
        minSize={50}>
        {/* {JSON.stringify(messages,null,2)} */}
        TODO:privew
        </ResizablePanel>
        </ResizablePanelGroup>
        

    </div>
   )
};