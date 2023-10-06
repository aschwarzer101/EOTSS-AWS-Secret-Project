#!/usr/bin/env node 
// You might want to add this to the previous line --experimental-specifier-resolution=node

import {  Command } from 'commander';


(async () =>{ 
    let program = new Command();
    program
        .version("3.0.0")
        .command('create', '📦 creates a new configuration for the a Chatbot')
        .command('show','🚚 display the current chatbot configuration')
        .command('deploy', '🌟 deploys the chatbot to your account via a remote CodeBuild')
        .description('🛠️  Easily create a chatbots');

    program.parse(process.argv);
} )();