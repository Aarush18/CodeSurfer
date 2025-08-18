"use client";

import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { useMutation} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { json } from "stream/consumers";

const Page = () => {

  const router = useRouter();

  const[value, setValue]=useState("");

  const trpc = useTRPC();

  const createProject = useMutation(trpc.projects.create.mutationOptions({
   onError:(error)=>{
    toast.error(error.message);

   },
   onSuccess:(data)=>{
    console.log(data);
    toast.success("Project Created");
    router.push(`/projects/${data.id}`);
   }
   
  }));

  return (
    <div className="h-screen w-screen flex items-center justify-center" >
      <div className="max-w-7xl mx-auto flex items-center flex-col gap-4 justify-center">
      <input style={{border: "1px solid black"}} value={value} onChange={(e) => setValue(e.target.value)}/>
   <Button  onClick={() =>  createProject.mutate({value: value})} disabled={ createProject.isPending}>
    Submit
   </Button>
   </div>

   </div>
  );
};

export default Page;
