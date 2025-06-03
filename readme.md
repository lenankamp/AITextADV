# AI Text Adventure

![screenshot image of text adventure application](/build/readme-ss.webp)

## Overview

This is a personal playground where I've been learning to code with LLM. It's a mess, and I'm more prone to wander than even the LLM. The text adventure interface itself is intended as a base framework for a kingmaker game I wanted for myself. The dungeon explorer is a side project because I wanted a class based game with AI generated class artwork.  

## Build / Use

The Text Adventure client requires no imports and can be run directly from a local browser, CORS be damned. The simplest setup for playing is with KoboldCPP, the default settings presume using Kobold for text, image, and speech generation. Personally using LM Studio, ComfyUI, and Kokoro, but it just connects via configurable API paths

## Contributions

Yes, please. Thing I really want most is prompt tuning.  

## LLM Used in Development and Testing

I pretty much exclusively used huihui-ai/Mistral-Small-24B-Instruct-2501-abliterated from huggingface for playing and testing. I like the Mistral Instruct a lot for it's ability to follow instructions and still have some creativity. The system was specifically setup to allow differing the question answer model and the story writer, but for most testing my system doesn't really handle model swapping all that well, so one versatile model is ideal.  

## License

This project is licensed under the Apache License, Version 2.0 - see [LICENSE](LICENSE) for details.  

This work is based on Fate Core System and Fate Accelerated Edition (found at https://www.faterpg.com/), products of Evil Hat Productions, LLC, developed, authored, and edited by Leonard Balsera, Brian Engard, Jeremy Keller, Ryan Macklin, Mike Olson, Clark Valentine, Amanda Valentine, Fred Hicks, and Rob Donoghue, and licensed for our use under the Creative Commons Attribution 3.0 Unported license (https://creativecommons.org/licenses/by/3.0/).  

## notes to self / known issues I want to address

continue testing affinity.  

record and have memories in context  
    added, untested  

issues with empty arrays, such as people and creatures being iterated through.  

modify consequence addition to be a stricter, verifying it's a "new" affliction  
    added "minutes" duration to rest time question to allow for ignoring minute afflictions  

issues with descriptions with numbers in them, issue seems limited to the tooltip, been ignoring  

Review Move to Area for preferring sublocation generation....not very smart on where it goes, but it goes  

Memories are returning as "$name remembers <actual response>"  

Dismissed follower in different area lost image? Not recreated  

world map image generation  
    more or less done  

default affinity for area  

faction system with affinity, at least something so maybe my own mother might know me  

area memory/events, possible happenings while gone  

add climate to world gen menu  

Have loader appear for entire time of initial world gen...  
