let convs = {
	legend:[
		"-cName quote conversation[Name]",
		"-qName quote one random comment from convs[Name].",
		"-q3Name quote 3 times from convs[Name].",
		"-r repeat that any number of times",
		"-r3 repeat max 3 times",
		"-t1.5 timeout before this line is 1.5s+reg timeout",
		"-p2 say this by player 2",
		"-f1 make face no 2",
		"-aName animation with that face"
	],

	smile: ["-rhe", "-rhi", "-rho", "-rha"],
	bigLaugh: ["-rahhaa", "-riihi", "-rehhe"],
	makeFunC:[ ["You dont have to play, realy, you already 'won', -q3smile", "In stupidity", "-f1 -qsmile", "-f1 -qsmile"], ["Really.. dont offend, we are just joking a little bit.", "But you give so much inspiration!", "-f1 -qsmile", "-f1 -qsmile"], ["Are you stupid or something?", "-f1 -qsmile", "-f1 -qsmile"],
		["This electricity is sooo bright. Brighter then you -qsmile", "-f1 -qsmile", "-f1 -qsmile"],
		["I guess who is not going to win this game...", "-f1 -qsmile", "-f1 -qsmile"] 
	],
	makeFun: ["You dont have to play, realy, you already 'won', -qsmile", "Really.. dont offend, we are just joking a little bit, but you give us so much inspiration, -qsmile", "Are you stupid or something?", "This electricity is sooo bright. Brighter then you, -qsmile", "I guess who's not going to win this game, -qsmile"],
	helloConv:[ ["-qhello", "-qhello", "-qhello", "-qhello", "Welcome to the game 'Wired'. Btw. we can talk to you but you can NOT talk to us. Do you understand?", "-t4 -p1 Type YES if you do."] ],
	hello:["Hi","Hello","Bonjour","Yo!"],
	rules:[ ["This is a turn by turn game. Your goal is to pick up all coins of your color in right order, which will get you an electroshocker, and kill your enemies. There are two teams, blue and red, and 2 players in each team. Yours is blue. In every turn you got two dices thrown, you move both players, and you can choose what player will play what dice.", "-t15 When you finish moves for one of the players, if some enemy player is on the same line (vertical or horizontal), you will electrify him, and he will go back to the field where he picked up his last coin. if he did not collect any coin, he will return to his 'Start' field.", "-t15 If you already complete all coins, you now have an electroshocker, then you will kill that enemy, and when you kill both of them, you are the winner.",
		"-t15 If both enemy players can be electrified after your move, only the closer one will got hit. Which means, that you too can use one player for protection, and the other one to chase all coins", "Also, you can use keyboard - spaceor enter to pick a player and arrows to move.", "-t6 Now click 'New Game', then pick a pleyer, and move him."] ],
	rulesMakeFun:[ ["He actually typed YES. -rhe", "-f1 -asmileShake -qsmile", "-f1 Are you stupid or something?", "OK, OK, OK, Remember you can NOT talk to us. Let us tell you the rules now..."] ],
	tactics:[ 
		["Tell him about tactics.","-p1 -t3 Yeah, there are 3 types of tactics: 1.you can CHASE ELECTROSHOCKER with both of your players.","-p1 -t7 2.you can join them and put the one as a PROTECTION to your main player.","-p1 -t10 3.you can send one player just to ATTACK the enemy, and other to chase an electroshocker.", "-p3 -t10 Hey, i have a BETTER IDEA! Why dont you use one player to chase an electroshocker, but the other for ATTACK AND PROTECTION! Ha??", "-p2 -t10 I have an idea too! Why dont you use your other player to ATTACK AND CHASE an electroshocker!", "-p3 -t4 -f2 That's BRILLIANT!", "-p4 -t10 UOOOOU!! I just got the best idea EVER!", "-p1 -t2 What?", "-p3 -t1 What?", "-p2 -t1 What?", "-p4 -t7 I forgot. -ablinkTwice -f2", "-p2 -t2 -f3 -ablinkTwice"] ], 
	smallTalk:[ 
		["Let me tell you a little about our God, THE DICER.", "-p1 -t5 He is the one that put the numbers on our dices, and the only one who have enough wisdom to do it right. ", "-p1 -t11 You may think that you get the random numbers on the dice, but actually He plans ahead what number will show you.", "-p4 -f2 -t5 -ablinkTwice", "-p1 -t5 With the provided number, you just move us around.","-p1 -t12 So now you think that you have a freedom to choose, and He wants you to feel that way...", "-p1 -t12 and now you think that you are the one in charge of everything...", "-p4 -t5 -f1 IN CHARGE, hehe, Get it?!", "-p3 -f1 -asmileShake -qsmile","-t2 -p1 -f2 Why do you have to ruin every story i say... oooohh."],
		["-p3 Do you know the rule for boring games?", "-p2 -t4 No.", "-p4 No.", "-p3 So this is for you my human friend: 'There are no boring games, just boring players!'", "-p4 -f1 -asmileShake -qsmile", "-p2 -f1 -asmileShake -qmakeFun"], 
		["-p1 Did you know, that when you are on the field where you took your last coin, electricity can NOT hurt you. ", "-t4 Really?", "-t2 -p1 Yea. You are, like, not on the wire line. Like you are OFFLINE.", "-p1 -t3 OFFLINE. Get it?!", "-p1 -ablinkTwice", "-p1 -t3 No you don't.", "-p3 This is a lame joke, dude.", "-p4 Yeah, really dude.", "-p2 I think that, his wife make him say it", "-p3 -f1 -asmileShake -qsmile", "-p4 -f1 -asmileShake -qsmile"] ],
	outOfMemory: [ ["Out of memory", "Out of mem,&y", "..t o. m&,..", "..."] ],
	wakeUp: [ ["-rA This was a good nap...", "-p1 -t5 Wake up guys!", "-t5 -p4 I'm up...but still sleepy", "-p2 -t10 -qhello , what's up?", "-t5 I see some guy playing.", "Oh.", "-t5 Wow, Who knows how long he plays this game.", "-t5 You are right, Helloooo, are you lost?", "Maybe he is stuck in this one game for days...", "-t5 He is like a lost soul maybe...", "Hey guy, do you need help?", "Maybe we should tell him the rules again?", "Yeah, we probably do, tell him..."] ],

	newGame: [ ["New Game! Great!"] ],
	winGame: [
		["-p1 -f1 -asmileShake WHOHOOO, WE WIN!", "-p2 -f1 -asmileShake YEEAAAAAAAAAAA!!", "-p4 Congratulations!", "-p3 Great job dude!"], 
		["-p1 -f1 -asmileShake Great job man!", "-p2 -f1 -asmileShake YEEAAAAAAAAAAA!!", "-p3 You are not as stupid, as you look...", "-p4 GG", "-p3 Play another if you're not afraid of losing."], 
		["-p1 -f1 -asmileShake TATARARATATATA!", "-p2 -f1 -asmileShake WOOOOOOOOO!!", "-p3 -f2 My vocabulary is very short, but i think some f word, or something.", "-p4 -f2 BLURP"] ,
		["-p1 -f1 -asmileShake Excelent game!", "-p2 -f1 -asmileShake You are AWESOME!!", "-p3 Dont be so full of yourself, we only have like 2kb of logic.", "-p4 He is right you know!", "-p3 -t1 -f2 -ablinkTwice"] ],
	lostGame: [ ["Do you know that Guns'n'roses song: ", "Dont you cryyyyy tonight, i still love you baby...", "-f1 -asmileShake -qmakeFun", "-f1 -qsmile"], ["Wow, you lost on level easy..", "I guess that cant be done by anyone..", "-f1 -asmileShake -qmakeFun", "-csmile"], ["Good game dude!", "Now find some electricity and do what every loser needs to do with it.", "-f1 -asmileShake -qmakeFun", "-csmile"], ["Don't worry, this game is not about winning.", "Yeah, its about LOSING!", "-f1 -asmileShake -qmakeFun", "-csmile"] ],
	meElectr: [ ["-f2 Hey, I have an idea. Why dont you go to the wall in your room... and put your fingers in two small holes in the wall, then you can say that you 'can feel our pain'."], [ "-f2 Thanks for this man, are you stupid or something?" ], ["-f2 This electricity is sooo bright. Brighter then you are."], ["-f2 I guess who's not going to win this game"], ["-f2 Thanks, i saw the light... aaaaaah" ], ["-f2 Why do you want to hurt me, what did i do to you??" ], ["-f2 O Dicer, save me from this man!"] ],
	enemyElectr: []

	
}