import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
const SvgIcon = ({
  className
}) => <svg viewBox="0 0 100 100" className={cn("w-full h-full", className)} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logo-primary-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="hsl(var(--primary))" />
        <stop offset="100%" stopColor="hsl(var(--secondary))" />
      </linearGradient>
      <linearGradient id="logo-light-grad" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
        <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0.3" />
      </linearGradient>
    </defs>

    {/* Central Prism Base */}
    <motion.path d="M50 15 L85 35 L85 65 L50 85 L15 65 L15 35 Z" stroke="url(#logo-primary-grad)" strokeWidth="4" strokeLinejoin="round" initial={{
    pathLength: 0,
    opacity: 0
  }} animate={{
    pathLength: 1,
    opacity: 1
  }} transition={{
    duration: 1.5,
    ease: "easeInOut"
  }} />
    
    {/* Inner Neural Connections */}
    <motion.path d="M50 15 L50 85 M15 35 L85 65 M15 65 L85 35" stroke="url(#logo-light-grad)" strokeWidth="2" initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} transition={{
    duration: 1,
    delay: 0.5
  }} />
    
    {/* Nodes */}
    <g fill="url(#logo-primary-grad)">
      <circle cx="50" cy="15" r="5" />
      <circle cx="85" cy="35" r="5" />
      <circle cx="85" cy="65" r="5" />
      <circle cx="50" cy="85" r="5" />
      <circle cx="15" cy="65" r="5" />
      <circle cx="15" cy="35" r="5" />
      
      {/* Center Core Node */}
      <circle cx="50" cy="50" r="7" />
    </g>
    
    {/* Floating Data Stream Elements */}
    <g fill="hsl(var(--primary))" opacity="0.8">
      <motion.circle cx="30" cy="25" r="2.5" animate={{
      y: [-3, 3, -3],
      opacity: [0.5, 1, 0.5]
    }} transition={{
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }} />
      <motion.circle cx="70" cy="75" r="2" animate={{
      y: [3, -3, 3],
      opacity: [0.5, 1, 0.5]
    }} transition={{
      duration: 2.5,
      repeat: Infinity,
      ease: "easeInOut",
      delay: 0.5
    }} />
    </g>
    <g fill="hsl(var(--secondary))" opacity="0.8">
      <motion.circle cx="75" cy="45" r="3" animate={{
      x: [-2, 2, -2],
      opacity: [0.5, 1, 0.5]
    }} transition={{
      duration: 3.5,
      repeat: Infinity,
      ease: "easeInOut",
      delay: 1
    }} />
      <motion.circle cx="25" cy="55" r="2" animate={{
      x: [2, -2, 2],
      opacity: [0.5, 1, 0.5]
    }} transition={{
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
      delay: 0.2
    }} />
    </g>
  </svg>;
export function LogoIcon({
  className,
  size = 32
}) {
  return <motion.div whileHover={{
    rotate: 3,
    scale: 1.05
  }} transition={{
    type: "spring",
    stiffness: 300,
    damping: 20
  }} style={{
    width: size,
    height: size
  }} className={cn("relative flex items-center justify-center shrink-0", className)}>
      <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full scale-150 pointer-events-none group-hover:bg-primary/30 transition-colors duration-500" />
      <SvgIcon />
    </motion.div>;
}
export function LogoHorizontal({
  className,
  iconSize = 32,
  asLink = true
}) {
  const content = <div className={cn("flex items-center gap-3 group", className)}>
      <LogoIcon size={iconSize} />
      <span className="font-bold text-sm md:text-base tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 group-hover:from-primary group-hover:to-secondary transition-all duration-300">
        DEAHost
AI Tools
      </span>
    </div>;
  if (!asLink) return content;
  return <Link to="/">{content}</Link>;
}
export function LogoFull({
  className,
  iconSize = 32,
  stacked = false,
  asLink = true
}) {
  const content = <div className={cn("group flex items-center", stacked ? "flex-col gap-5" : "flex-row gap-3", className)}>
      <LogoIcon size={iconSize} />
      <span className={cn("font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 group-hover:from-primary group-hover:to-secondary transition-all duration-500", stacked ? "text-lg md:text-xl" : "text-sm md:text-base")}>
        DEAHost 
AI Tools
      </span>
    </div>;
  if (!asLink) return content;
  return <Link to="/">{content}</Link>;
}