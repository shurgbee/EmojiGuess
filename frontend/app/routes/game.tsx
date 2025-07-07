import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { useEffect, useState } from "react";
import type { userType } from "../routes.ts";
import type App from "~/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Game" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Game() {
  useEffect(()=>{
  }, [])
  return (
    <>
    <div className="flex flex-col content-center items-center justify-center w-screen">
        Testing
    </div>
    </>
  )
}
