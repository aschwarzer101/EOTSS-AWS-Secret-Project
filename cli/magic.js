#!/usr/bin/env node 
"use strict";
// You might want to add this to the previous line --experimental-specifier-resolution=node
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
(async () => {
    let program = new commander_1.Command();
    program
        .version("3.0.0")
        .command('create', '📦 creates a new configuration for the a Chatbot')
        .command('show', '🚚 display the current chatbot configuration')
        .command('deploy', '🌟 deploys the chatbot to your account')
        .description('🛠️  Easily create a chatbots');
    program.parse(process.argv);
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFnaWMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtYWdpYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLDJGQUEyRjs7QUFFM0YseUNBQXFDO0FBR3JDLENBQUMsS0FBSyxJQUFJLEVBQUU7SUFDUixJQUFJLE9BQU8sR0FBRyxJQUFJLG1CQUFPLEVBQUUsQ0FBQztJQUM1QixPQUFPO1NBQ0YsT0FBTyxDQUFDLE9BQU8sQ0FBQztTQUNoQixPQUFPLENBQUMsUUFBUSxFQUFFLGtEQUFrRCxDQUFDO1NBQ3JFLE9BQU8sQ0FBQyxNQUFNLEVBQUMsOENBQThDLENBQUM7U0FDOUQsT0FBTyxDQUFDLFFBQVEsRUFBRSx3Q0FBd0MsQ0FBQztTQUMzRCxXQUFXLENBQUMsK0JBQStCLENBQUMsQ0FBQztJQUVsRCxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNoQyxDQUFDLENBQUUsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZSBcbi8vIFlvdSBtaWdodCB3YW50IHRvIGFkZCB0aGlzIHRvIHRoZSBwcmV2aW91cyBsaW5lIC0tZXhwZXJpbWVudGFsLXNwZWNpZmllci1yZXNvbHV0aW9uPW5vZGVcblxuaW1wb3J0IHsgIENvbW1hbmQgfSBmcm9tICdjb21tYW5kZXInO1xuXG5cbihhc3luYyAoKSA9PnsgXG4gICAgbGV0IHByb2dyYW0gPSBuZXcgQ29tbWFuZCgpO1xuICAgIHByb2dyYW1cbiAgICAgICAgLnZlcnNpb24oXCIzLjAuMFwiKVxuICAgICAgICAuY29tbWFuZCgnY3JlYXRlJywgJ/Cfk6YgY3JlYXRlcyBhIG5ldyBjb25maWd1cmF0aW9uIGZvciB0aGUgYSBDaGF0Ym90JylcbiAgICAgICAgLmNvbW1hbmQoJ3Nob3cnLCfwn5qaIGRpc3BsYXkgdGhlIGN1cnJlbnQgY2hhdGJvdCBjb25maWd1cmF0aW9uJylcbiAgICAgICAgLmNvbW1hbmQoJ2RlcGxveScsICfwn4yfIGRlcGxveXMgdGhlIGNoYXRib3QgdG8geW91ciBhY2NvdW50JylcbiAgICAgICAgLmRlc2NyaXB0aW9uKCfwn5ug77iPICBFYXNpbHkgY3JlYXRlIGEgY2hhdGJvdHMnKTtcblxuICAgIHByb2dyYW0ucGFyc2UocHJvY2Vzcy5hcmd2KTtcbn0gKSgpOyJdfQ==