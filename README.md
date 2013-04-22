#server-benchmakr

##Purpose

Easy way to start/stop a server remotely on a device (i.e. ec2 instance) and run pylot tests on a client device (i.e. other ec2 instance)

###Server

Set your commands and run the server-router.js via node
	
	node server-router.js

This starts 3 servers listening on defined ports (default: 9001,9002,9003). Each server has a purpose. It can start, stop or reset the commander. The commander executes or stops a command. The server can run or reset a commander command if it isn't locked. You have to unlock the server before running the next start/reset request.

####example flow:

	curl localhost:9001		[start] to run a command
	
	//commander is now on command #1
	{your benchmark processes here}

	curl localhost:9002		[stop] 	to stop running command
	curl localhost:9001		[start] to run next command
	
	//commander is now on command #2
	{your benchmark processes 2 here}

	curl localhost:9002		[stop] 	to stop running command
	curl localhost:9003		[reset] to reset commander

	//commander is now on command #1
