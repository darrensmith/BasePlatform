BasePlatform for NodeJS

Make the following manual changes on the machine that BasePlatform is being run on:

1. Configure to run on port 80 by running:
   sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 8080
2. Install forever
3. Run forever start server.js
4. Run forever list to view or forever stop server.js to stop
5. Update node_modules/swaggerize-express/lib/expressroutes.js line 58 to remove .value after val
6. Update node_modules/enjoi/lib/enjoi.js. After line 73 add:
            case 'file':
                joischema = string(current);
                break;
7. Run  sudo /opt/bitnami/ctlscript.sh stop apache