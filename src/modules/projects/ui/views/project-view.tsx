"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { id } from "date-fns/locale";
import {
  ResizablePanel,
  ResizableHandle,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { MessagesContainer } from "../components/messages-container";
import { Suspense, useState } from "react";
import { Fragment } from "@/generated/prisma";
import { ProjectHeader } from "../components/project-header";
import { FragmentWeb } from "../components/fragment-web";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EyeIcon, CodeIcon, Code, CrownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileExplorer } from "@/components/file-explorer";
import { UserControl } from "@/components/user-control";
import { useAuth } from "@clerk/nextjs";

interface Props {
  projectId: string;
}

export const ProjectView = ({ projectId }: Props) => {
  const{has}=useAuth();
  const hasProAccess = has?.({plan:"pro"});

  const trpc = useTRPC();

  const [activeFragment, setActiveFragment] = useState<Fragment | null>(null);
  const [tabsState, setTabsState] = useState<"preview" | "code">("preview");

  return (
    <div className="h-screen">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          defaultSize={35}
          minSize={20}
          className="flex flex-col min-h-0"
        >
          <Suspense fallback={<p> Loading Project </p>}>
            <ProjectHeader projectId={projectId} />
          </Suspense>
          <Suspense fallback={<p>loading messages..</p>}>
            <MessagesContainer
              projectId={projectId}
              activeFragment={activeFragment}
              setActiveFragment={setActiveFragment}
            />
          </Suspense>
          {/* {JSON.stringify(project)} */}
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={65} minSize={50}>
          <Tabs
            className="h-full gap-y-0 "
            defaultValue="preview"
            value={tabsState}
            onValueChange={(value) => {
              setTabsState(value as "preview" | "code");
            }}
          >
            <div className="w-full flex items-center p-2 border-b gap-x-2 justify-between">
              <TabsList className="h-8 p-0 border rounded-md">
                <TabsTrigger
                  value="preview"
                  className="rounded-md flex items-center gap-x-1"
                >
                  <EyeIcon /> <span>Demo</span>
                </TabsTrigger>
                <TabsTrigger
                  value="code"
                  className="rounded-md flex items-center gap-x-1"
                >
                  <CodeIcon /> <span>Code</span>
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-x-2">
                {!hasProAccess && (
                <Button asChild size="sm" variant="default">
                  <Link href="/pricing" className="flex items-center gap-x-1">
                    <CrownIcon /> Upgrade
                  </Link>
                </Button>)}
                <UserControl/>
              </div>
            </div>

            <TabsContent value="preview">
              {!!activeFragment && <FragmentWeb data={activeFragment} />}
            </TabsContent>
            <TabsContent value="code" className="min-h-0">
               {!!activeFragment?.files && (
                <FileExplorer 
                    files={activeFragment.files as {[path : string] : string }}
                />
               )}
            </TabsContent>
          </Tabs>
          {/* {JSON.stringify(messages,null,2)} */}
          TODO:privew
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
