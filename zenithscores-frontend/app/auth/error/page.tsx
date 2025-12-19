"use client"

import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"

function ErrorContent() {
    const searchParams = useSearchParams()
    const error = searchParams.get("error")

    return (
        <div className="space-y-6 text-center">
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center justify-center p-3 rounded-2xl bg-red-500/10 border border-red-500/20 mb-4"
            >
                <AlertCircle className="w-8 h-8 text-red-400" />
            </motion.div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Authentication Error</h1>

            <div className="p-4 rounded-xl bg-red-900/10 border border-red-500/10 text-red-200">
                <p>
                    {error === "Configuration" && "There is a problem with the server configuration."}
                    {error === "AccessDenied" && "Access denied. You do not have permission to sign in."}
                    {error === "Verification" && "The verification link was invalid or has expired."}
                    {!error && "An unknown error occurred during authentication."}
                    {error && error !== "Configuration" && error !== "AccessDenied" && error !== "Verification" && error}
                </p>
            </div>

            <div className="pt-4">
                <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                </Link>
            </div>
        </div>
    )
}

export default function ErrorPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ErrorContent />
        </Suspense>
    )
}
