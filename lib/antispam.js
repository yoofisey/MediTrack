const DISPOSABLE_DOMAINS = new Set([
  "tempmail.com","throwaway.email","guerrillamail.com","guerrillamail.net",
  "tempail.com","temp-mail.org","fakeinbox.com","sharklasers.com",
  "guerrillamailblock.com","grr.la","dispostable.com","mailinator.com",
  "yopmail.com","yopmail.fr","trashmail.com","trashmail.me",
  "trashmail.net","trashmail.org","discard.email","discardmail.com",
  "maildrop.cc","getnada.com","mohmal.com","tmpmail.net",
  "tmpmail.org","10minutemail.com","mintemail.com","spamgourmet.com",
  "mailnesia.com","boun.cr","bouncr.com","chacuo.net",
  "disposableaddress.com","emailondeck.com","fakeinbox.com",
  "fakemailgenerator.com","harakirimail.com","hulapla.de",
  "incognitomail.org","jetable.org","mailcatch.com","mailexpire.com",
  "maillinator.com","mailmoat.com","mailnull.com","mailshell.com",
  "mailsiphon.com","mailslurp.com","mailtank.net","mailtv.net",
  "mailtv.tv","mailtothis.com","mailzilla.com","nomail.xl.cx",
  "nospam.ze.tc","nospamfor.us","nowmymail.com","owlpic.com",
  "proxymail.eu","rcpt.at","reallymymail.com","recode.me",
  "recursor.net","regbypass.com","safetymail.info","safetypost.de",
  "schafgel.de","selfdestructingmail.com","sendspam.ca","skeefmail.com",
  "slaskpost.se","slipry.net","smapxs.net","smashmail.de",
  "smslisto.com","sogetthis.com","soodonims.com","spam4.me",
  "spamavert.com","spambob.com","spambob.net","spambog.com",
  "spambog.ru","spambog.de","spambox.info","spambox.us",
  "spamcannon.com","spamcannon.net","spamcero.com","spamcorptastic.com",
  "spamcowboy.com","spamcowboy.net","spamcowboy.org","spamday.com",
  "spamex.com","spamfighter.cf","spamfighter.ga","spamfighter.ml",
  "spamfighter.tk","spamfree24.com","spamfree24.de","spamfree24.eu",
  "spamfree24.info","spamfree24.net","spamfree24.org","spamgoo.com",
  "spamherelots.com","spamhereplease.com","spamhole.com","spamify.com",
  "spaminator.de","spamkill.info","spaml.com","spaml.de",
  "spammotel.com","spamobox.com","spamoff.de","spamslicer.com",
  "spamspot.com","spamstack.net","spamthis.co.uk","spamthisplease.com",
  "spamtrail.com","spamtrap.ro","speed.1s.fr","superrito.com",
  "teleworm.us","tempemail.co.za","tempemail.net","tempemail.biz",
  "tempinbox.co.uk","tempinbox.com","tempmail.eu","tempmail.it",
  "tempmail2.com","tempmaildemo.com","tempmailer.com","tempmailer.de",
  "tempomail.fr","temporarily.de","temporarioemail.com.es",
  "temporarioemail.com","temporaryemail.net","temporaryemail.us",
  "temporaryforwarding.com","temporaryinbox.com","temporarymailaddress.com",
  "thecloudindex.com","tilien.com","tittbit.in","tizi.com",
  "tmailinator.com","toiea.com","toomail.biz","topranklist.de",
  "tradermail.info","trash-amil.com","trash-mail.at","trash-mail.br",
  "trash-mail.com","trash-mail.de","trash-me.com","trash2009.com",
  "trashdevil.com","trashdevil.de","trashemail.de","trashmail.at",
  "trashmail.com","trashmail.de","trashmail.me","trashmail.net",
  "trashmail.org","trashmail.ws","trashmailer.com","trashymail.com",
  "trashymail.net","trillianpro.com","turual.com","twinmail.de",
  "tyldd.com","uggsrock.com","upliftnow.com","uplipht.com",
  "venompen.com","veryreally","vidchart.com","viditag.com",
  "viewcastmedia.com","viewcastmedia.net","viewcastmedia.org",
  "wetrainbayarea.com","wetrainbayarea.org","wh4f.org","whatiaas.com",
  "whatpaas.com","whyspam.me","wikidocuslice.com","willhackforfood.biz",
  "willselfdestruct.com","winemaven.info","wronghead.com","wuzup.net",
  "wuzupmail.net","wwwnew.eu","xagloo.com","xemaps.com",
  "xents.com","xjoi.com","xmaily.com","xoxy.net",
  "zehnminutenmail.de","1zhuan.com","33mail.com","3d-painting.com",
  "4warding.com","4warding.net","4warding.org","5ghgfhfghfgh.tk",
  "60minutemail.com","675hosting.com","675hosting.net","675hosting.org",
  "6url.com","75hosting.com","75hosting.net","75hosting.org",
  "7tags.com","9ox.net","a-bc.net","afrobacon.com",
  "agedmail.com","ajaxapp.net","alivance.com","amail.com",
  "amilegit.com","amiri.net","anappthat.com","ano-mail.net",
  "anonbox.net","anonymbox.com","antichef.com","antichef.net",
  "antispam.de","antispammail.de","armyspy.com","artman-conception.com",
  "azmeil.tk","baxomale.ht.cx","beefmilk.com","bigstring.com",
  "binkmail.com","bio-muesli.net","bladesmail.net","bloatbox.com",
  "bobmail.info","bodhi.lawlita.com","bofthew.com","bootybay.de",
  "boun.cr","bouncr.com","breakthru.com","brefmail.com",
  "brennendesreich.de","broadbandninja.com","bsnow.net","bspamfree.org",
  "buffemail.com","bugmenot.com","bumpymail.com","bundes-ede.de",
  "burdz.biz","burnthespam.info","bustmail.com","buymoreplays.com",
  "buyusedlibrarybooks.org","byom.de","c2.hu","cachedot.net",
  "casualdx.com","cellurl.com","centermail.com","centermail.net",
  "chammy.info","chaport.com","cheatmail.de","chogmail.com",
  "choicemail1.com","clixser.com","cmail.net","cmail.org",
  "coldemail.info","cool.fr.nf","courriel.fr.nf","courrieltemporaire.com",
  "crapmail.org","crazymailing.com","cubiclink.com","curryworld.de",
  "cust.in","cuvox.de","d3p.dk","dacoolest.com",
  "dandikmail.com","dayrep.com","dcemail.com","deadaddress.com",
  "deadspam.com","delikkt.de","despam.it","despammed.com",
  "devnullmail.com","dfgh.net","digitalsanctuary.com","dingbone.com",
  "discard.email","discardmail.com","discardmail.de","disposableaddress.com",
  "disposableemailaddresses.emailmiser.com","disposableinbox.com",
  "dispose.it","disposeamail.com","disposemail.com","disposm.com",
  "dispostable.com","dm.w3internet.co.uk","dodgeit.com","dodgit.com",
  "dodgit.org","dontreg.com","dontsendmespam.de","drdrb.com",
  "drdrb.net","droplar.com","dropmail.me","duam.net",
  "dudmail.com","dump-email.info","dumpandjunk.com","dumpmail.de",
  "dumpyemail.com","e-mail.com","e-mail.org","e4ward.com",
  "easytrashmail.com","ee1.pl","ee2.pl","eelmail.com",
  "einmalmail.de","einrot.com","einrot.de","eintagsmail.de",
  "email-fake.cf","email-fake.com","email-fake.ga","email-fake.gq",
  "email-fake.ml","email-fake.tk","email-temp.com","email-temporario.com.br",
  "email.lizar.biz","email60.com","emailage.cf","emailage.ga",
  "emailage.gq","emailage.ml","emailage.tk","emaildienst.de",
  "emailgo.de","emailias.com","emailigo.de","emailinfive.com",
  "emaillime.com","emailmiser.com","emailproxsy.com","emails.ga",
  "emailsensei.com","emailspam.cf","emailspam.ga","emailspam.gq",
  "emailspam.ml","emailspam.tk","emailtemporanea.com","emailtemporanea.net",
  "emailtemporar.ro","emailtemporario.com.br","emailthe.net","emailtmp.com",
  "emailto.de","emailwarden.com","emailx.at.hm","emailxfer.com",
  "emz.net","enterto.com","ephemail.net","etranquil.com",
  "etranquil.net","etranquil.org","evopo.com","explodemail.com",
  "express.net.ua","eyepaste.com","fakeinbox.com","fakeinformation.com",
  "fakemail.fr","fakemailz.com","fammix.com","fansworldwide.de",
  "fantasymail.de","fastacura.com","fastchevy.com","fastchrysler.com",
  "fastkawasaki.com","fastmazda.com","fastmitsubishi.com","fastnissan.com",
  "fastsubaru.com","fastsuzuki.com","fasttoyota.com","fastyamaha.com",
  "fightallspam.com","filzmail.com","findemail.info","findfastly域名过期",
  "firemail.cc","fivemail.de","fixmail.tk","fizmail.com",
  "fizyeta.com","fleckens.hu","flottenbrief.info","fluemail.com",
  "followup.cc","fond-dyady.ru","footard.com","forgetmail.com",
  "fr33mail.info","frapmail.com","freemails.cf","freemails.ga",
  "freemails.ml","freundin.ru","friendlymail.co.uk","front14.org",
  "fuckingduh.com","fudgerub.com","fux0ringduh.com","fyii.de",
  "garliclife.com","gehensiulli.com","get-mail.cf","get-mail.ga",
  "get-mail.ml","get-mail.tk","get1mail.com","get2mail.fr",
  "get2mail.net","get2mail.org","getonemail.com","getonemail.net",
  "ghosttexter.de","girlsundertheinfluence.com","gishpuppy.com",
  "goemailgo.com","gorillaswithdirtyarmpits.com","gotmail.com",
  "gotmail.net","gotmail.org","gowikibooks.com","gowikicampus.com",
  "gowikicars.com","gowikifilms.com","gowikigames.com","gowikimusic.com",
  "gowikinetwork.com","gowikitravel.com","gowikitv.com","grandmamail.com",
  "grandmasmail.com","great-host.in","greensloth.com","greermail.com",
  "guerrillamail.com","guerrillamail.biz","guerrillamail.de",
  "guerrillamail.info","guerrillamail.net","guerrillamail.org",
  "guerrillamailblock.com","guerrillamailblocks.com","guerrillamailch.com",
  "guerrillamaildev.com","guerrillamailinfo.com","guerrillamailindustries.com",
  "guerrillamail.info","guerrillamail.biz","guerrillamail.de",
  "guerrillamail.net","guerrillamail.org","guerrillamailblocks.com",
  "guerrillamailblock.com","guerrillamailch.com","guerrillamaildev.com",
  "guerrillamailinfo.com","guerrillamailindustries.com","guerrillamail.info",
  "guerrillamail.biz","guerrillamail.de","guerrillamail.net",
  "guerrillamail.org","guerrillamailblocks.com","guerrillamailblock.com",
  "guerrillamailch.com","guerrillamaildev.com","guerrillamailinfo.com",
  "guerrillamailindustries.com","guerrillamail.info","guerrillamail.biz",
  "guerrillamail.de","guerrillamail.net","guerrillamail.org",
  "guerrillamailblocks.com","guerrillamailblock.com","guerrillamailch.com",
  "guerrillamaildev.com","guerrillamailinfo.com","guerrillamailindustries.com",
  "gustr.com","h8s.org","hacccc.com","haltospam.com",
  "harakirimail.com","hartbot.de","hat-gansen.de","hatespam.org",
  "herp.in","hidemail.de","hidzz.com","hmamail.com",
  "hopemail.biz","hot-mail.cf","hot-mail.ga","hot-mail.gq",
  "hot-mail.ml","hot-mail.tk","hotpop.com","hulapla.de",
  "hushmail.com","ichimail.com","imails.info","inbax.tk",
  "inbox.si","inboxalias.com","inboxclean.com","inboxclean.org",
  "inboxproxy.com","incognitomail.com","incognitomail.net","incognitomail.org",
  "ineec.net","infocom.zp.ua","inoutmail.de","inoutmail.info",
  "inoutmail.net","insorg-mail.info","insideairport.com","instant-mail.de",
  "ipoo.org","irish2me.com","iwi.net","jetable.com",
  "jetable.fr.nf","jetable.net","jetable.org","jnxjn.com",
  "jourrapide.com","jsrsolutions.com","junk1e.com","junkmail.com",
  "junkmail.ga","junkmail.gq","junkmail.ml","junkmail.tk",
  "kaacedral.com","kay[m].biz","keemail.me","keepmymail.com",
  "killmail.com","killmail.net","kir.ch.tc","klassmaster.com",
  "klassmaster.net","klzlk.com","kook.ml","kurzepost.de",
  "lawlita.com","letthemeatspam.com","lhsdv.com","lifebyfood.com",
  "link2mail.net","litedrop.com","lol.ovpn.to","lookugly.com",
  "lopl.co.cc","lortemail.dk","lovemeleaveme.com","lr78.com",
  "lroid.com","lukop.dk","m21.cc","maboard.com",
  "mail-temporaire.fr","mail.by","mail.mezimages.net","mail.zp.ua",
  "mail114.net","mail1a.de","mail1web.com","mail21.cc",
  "mail2rss.org","mail333.com","mail4t.com","mailbidon.com",
  "mailblocks.com","mailblog.biz","mailbucket.org","mailcat.biz",
  "mailcatch.com","maildrop.cc","maildrop.cf","maildrop.ga",
  "maildrop.gq","maildu.de","maildx.com","maileater.com",
  "mailed.ro","maileimer.de","mailexpire.com","mailfa.tk",
  "mailforspam.com","mailfree.ga","mailfree.gq","mailfree.ml",
  "mailfree.tk","mailfs.com","mailguard.me","mailhazard.com",
  "mailhazard.us","mailhz.me","mailimate.com","mailin8r.com",
  "mailinater.com","mailinator.com","mailinator.net","mailinator.org",
  "mailinator.us","mailinator2.com","mailincubator.com","mailismagic.com",
  "mailmate.com","mailme.ir","mailme.lv","mailme24.com",
  "mailmetrash.com","mailmoat.com","mailnator.com","mailnesia.com",
  "mailnull.com","mailorg.org","mailpick.biz","mailproxsy.com",
  "mailquack.com","mailrock.biz","mailsac.com","mailscrap.com",
  "mailshell.com","mailsiphon.com","mailslurp.com","mailslurp.eu",
  "mailslurp.me","mailslurp.top","mailsmash.com","mailsor.com",
  "mailspam.biz","mailspam.cf","mailspam.ga","mailspam.gq",
  "mailspam.ml","mailspam.tk","mailspeed.de","mailspot.biz",
  "mailspot.cf","mailspot.ga","mailspot.gq","mailstorm.ru",
  "mailsucks.com","mailswing.com","mailtemp.info","mailtemporaire.fr",
  "mailtest.biz","mailtest.info","mailtest.me","mailtest.net",
  "mailtest.org","mailtest.tk","mailthis.de","mailticket.biz",
  "mailto.me","mailtothis.com","mailtrash.net","mailtv.net",
  "mailtv.tv","mailunter.com","mailup.net","mailwire.us",
  "mailxfire.com","mailz.info","mauu.de","mehl.cc",
  "mehlwurm.de","merda.futbol","merda.us","merda.xyz",
  "mfsa.ru","mierdamail.com","migmail.pl","migumail.com",
  "mindless.com","ministry-of-silly-walks.de","mintemail.com",
  "misterpinball.de","mm5.se","moakt.com","mobi.web.id",
  "mohmal.com","mohmal.im","mohmal.in","mohmal.me",
  "mohmal.tech","moncourrier.fr.nf","monemail.fr.nf","monmail.fr.nf",
  "monumentmail.com","msa.minsmail.com","mt2015.com","mx0.wwwnew.eu",
  "my10minutemail.com","myalias.pw","mycard.net.ua","mycleaninbox.net",
  "myemailboxy.com","mymail-in.net","mymailoasis.com","mymailoasis.net",
  "mymailphx.com","mymailtemp.com","mymelt.com","mymnet.de",
  "myphantom.com","mysamp.de","myspaceinc.com","myspaceinc.net",
  "myspaceinc.org","myspacepimpedup.com","mytemp.email","mytempemail.com",
  "mytempmail.com","mythrowaway.info","mytempmail.com","mytempemail.org",
  "nabala.com","neomailbox.com","nepwk.com","nervmich.net",
  "nervtansen.de","netmails.com","netmails.net","neverbox.com",
  "nice-4u.com","nincsmail.hu","nnh.com","no-spam.ws",
  "noblehotel.com","nobulk.com","noclickemail.com","nogmailspam.info",
  "nomail.xl.cx","nomail2me.com","nomorespamemails.com","nonspam.eu",
  "nonspammer.de","noref.in","nospam.ze.tc","nospam4.us",
  "nospamfor.us","nospammail.net","nospamme.com","nospamper.com",
  "nospamtest.info","nospamthanks.info","nothingtoseehere.ca",
  "nowmymail.com","nurfuerspam.de","nus.edu.sg","nwldx.com",
  "objectmail.com","obobbo.com","odnorazovoe.ru","oneoffemail.com",
  "onewaymail.com","oopi.org","ordinaryamerican.net","otherinbox.com",
  "ourklips.com","outlawspam.com","ovpn.to","owlpic.com",
  "pancakemail.com","pimpedupmyspace.com","pjjkp.com","plexolan.de",
  "poczta.onet.pl","poczta24.pl","pookmail.com","privacy.net",
  "privatdemail.net","proxymail.eu","prtnx.com","punkass.com",
  "putthisinyouremail.com","qq.com","quickinbox.com","quickmail.nl",
  "rcpt.at","reallymymail.com","recode.me","recursor.net",
  "regbypass.com","regbypass.comsafe-mail.net","rejectmail.com",
  "reliable-mail.com","rhyta.com","rklips.com","rmqkr.net",
  "royal.net","rppkn.com","rtrtr.com","s0ny.net",
  "safe-mail.net","safersignup.de","safetymail.info","safetypost.de",
  "sandelf.de","saynotospams.com","scatmail.com","schafgel.de",
  "schrott-email.de","secretemail.de","secure-mail.biz","selfdestructingmail.com",
  "sendspam.ca","sendspam.de","shiftmail.com","shitmail.me",
  "shitmail.org","shitware.nl","shmeriously.com","shortmail.net",
  "sibmail.com","sinnlos-mail.de","skeefmail.com","slaskpost.se",
  "slipry.net","slopslump.com","slowslow.de","smashmail.de",
  "smellfear.com","snakemail.com","sneakemail.com","sneakymail.de",
  "snkmail.com","sofimail.com","sofort-mail.de","softpls.asia",
  "sogetthis.com","soodonims.com","spam.la","spam.su",
  "spam4.me","spamavert.com","spambob.com","spambob.net",
  "spambob.org","spambog.com","spambog.de","spambog.ru",
  "spambot.biz","spambox.info","spambox.irishspringrealty.com",
  "spambox.us","spambox.xyz","spamcannon.com","spamcannon.net",
  "spamcero.com","spamcorptastic.com","spamcowboy.com","spamcowboy.net",
  "spamcowboy.org","spamday.com","spamex.com","spamfighter.cf",
  "spamfighter.ga","spamfighter.ml","spamfighter.tk","spamfree24.biz",
  "spamfree24.com","spamfree24.de","spamfree24.eu","spamfree24.info",
  "spamfree24.net","spamfree24.org","spamgoes.in","spamgourmet.com",
  "spamgourmet.net","spamgourmet.org","spamherelots.com","spamhereplease.com",
  "spamhole.com","spamify.com","spaminator.de","spamkill.info",
  "spaml.com","spaml.de","spamlife.com","spamlives.com",
  "spammotel.com","spamobox.com","spamoff.de","spamslicer.com",
  "spamspot.com","spamstack.net","spamthis.co.uk","spamthisplease.com",
  "spamtrail.com","spamtrap.ro","speed.1s.fr","superrito.com",
  "superstachel.de","suremail.info","svk.jp","sweetxxx.de",
  "sweet.dnsd.info","tafmail.com","tagyoureit.com","talkinator.com",
  "tapchicuoihoi.com","tci.cc","teleworm.com","teleworm.us",
  "temp-mail.org","temp-mail.ru","tempemail.biz","tempemail.co.za",
  "tempemail.com","tempemail.net","tempemailio.com","tempinbox.com",
  "tempinbox.co.uk","tempmail.app","tempmail.cloud","tempmail.com",
  "tempmail.de","tempmail.eu","tempmail.gq","tempmail.io",
  "tempmail.it","tempmail.info","tempmail.net","tempmail.nu",
  "tempmail.org","tempmail.plus","tempmail2.com","tempmail3.com",
  "tempmail4.com","tempmaildemo.com","tempmailer.com","tempmailer.de",
  "tempmailer.net","tempomail.fr","temporarily.de","temporarioemail.com",
  "temporary-email-addresses.com","temporaryemail.net","temporaryemail.us",
  "temporaryforwarding.com","temporaryforwarding.org","temporaryinbox.com",
  "temporaryinbox.net","temporarymailaddress.com","tempthe.net",
  "temptheinfo.com","tempmailer.com","tempmailer.net","tempmailer.org",
  "terok.net","thanksnospam.info","thankspmall.com","thecloudindex.com",
  "thehackersessions.com","theredzones.com","thespamfighter.com",
  "thrma.com","throam.com","thrott.com","tittbit.in",
  "tizi.com","tmailinator.com","toiea.com","toomail.biz",
  "topranklist.de","tradermail.info","trbvm.com","trbvn.com",
  "trbvt.com","trbvu.com","trbvv.com","trbvw.com",
  "trbvy.com","trbvz.com","trc8.com","trickmail.net",
  "trillianpro.com","trollspam.com","truman-mail.com","trytoga.com",
  "tudkfdd.com","turual.com","twinmail.de","tyldd.com",
  "uberlogin.com","uggsrock.com","ukp.net","upliftnow.com",
  "uplipht.com","valdebébé.com","venompen.com","veryreally",
  "vidchart.com","viditag.com","viewcastmedia.com","viewcastmedia.net",
  "viewcastmedia.org","vomoto.com","vpn.st","vsimcard.com",
  "vubby.com","wasteland.rfc822.org","webemail.me","weg-werf-email.de",
  "wegwerfadresse.de","wegwerfemail.com","wegwerfemail.de","wegwerfmail.de",
  "wegwerfmail.net","wegwerfmail.org","weg-werf-mail.de","wegwerfemail.at",
  "wegwerfemail.info","wegwerfemail.com","wegwerfemail.de","wegwerfmail.at",
  "wegwerfmail.info","wegwerfmail.net","wegwerfmail.org","weg-werf-email.de",
  "wegwerf-email.info","wegwerf-email.de","wegwerfadresse.de","wegwerfmail.de",
  "wegwerfmail.info","wegwerfmail.net","wegwerfmail.org","wetrainbayarea.com",
  "wetrainbayarea.org","wh4f.org","whatiaas.com","whatpaas.com",
  "whyspam.me","wikidocuslice.com","wilemail.com","willhackforfood.biz",
  "willselfdestruct.com","winemaven.info","wronghead.com","wuzup.net",
  "wuzupmail.net","wwwnew.eu","xagloo.com","xemaps.com",
  "xents.com","xjoi.com","xmaily.com","xoxy.net",
  "yapped.net","yeah.net","yep.it","yogamaven.com",
  "yomail.info","yomail.org","yopmail.com","yopmail.fr",
  "yopmail.gq","yopmail.net","you-spam.com","ypmail.webarnak.fr.eu.org",
  "yuurok.com","zehnminutenmail.de","zippymail.info","zoaxe.com",
  "zoemail.org"
]);

export function isDisposableEmail(email) {
  if (!email || typeof email !== "string") return false;
  const domain = email.split("@")[1]?.toLowerCase().trim();
  if (!domain) return false;
  return DISPOSABLE_DOMAINS.has(domain);
}

const SIGNUP_MAX = 3;
const SIGNUP_WINDOW = 3600000;
const OTP_MAX = 5;
const OTP_WINDOW = 900000;

function getAttempts(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { count: 0, firstAt: 0 };
    return JSON.parse(raw);
  } catch { return { count: 0, firstAt: 0 }; }
}

function setAttempts(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

export function checkSignupRate(email) {
  const key = `mt_su_${email.toLowerCase().trim()}`;
  const a = getAttempts(key);
  const now = Date.now();
  if (a.firstAt && now - a.firstAt > SIGNUP_WINDOW) {
    setAttempts(key, { count: 0, firstAt: now });
    return { allowed: true, remaining: SIGNUP_MAX };
  }
  if (a.count >= SIGNUP_MAX) {
    const waitMin = Math.ceil((SIGNUP_WINDOW - (now - a.firstAt)) / 60000);
    return { allowed: false, remaining: 0, waitMin };
  }
  return { allowed: true, remaining: SIGNUP_MAX - a.count };
}

export function recordSignupAttempt(email) {
  const key = `mt_su_${email.toLowerCase().trim()}`;
  const a = getAttempts(key);
  const now = Date.now();
  if (a.firstAt && now - a.firstAt > SIGNUP_WINDOW) {
    setAttempts(key, { count: 1, firstAt: now });
  } else {
    setAttempts(key, { count: a.count + 1, firstAt: a.firstAt || now });
  }
}

export function checkOtpAttempts(email) {
  const key = `mt_otp_${email.toLowerCase().trim()}`;
  const a = getAttempts(key);
  const now = Date.now();
  if (a.firstAt && now - a.firstAt > OTP_WINDOW) {
    setAttempts(key, { count: 0, firstAt: now });
    return { allowed: true, remaining: OTP_MAX };
  }
  if (a.count >= OTP_MAX) {
    const waitMin = Math.ceil((OTP_WINDOW - (now - a.firstAt)) / 60000);
    return { allowed: false, remaining: 0, waitMin };
  }
  return { allowed: true, remaining: OTP_MAX - a.count };
}

export function recordOtpAttempt(email) {
  const key = `mt_otp_${email.toLowerCase().trim()}`;
  const a = getAttempts(key);
  const now = Date.now();
  if (a.firstAt && now - a.firstAt > OTP_WINDOW) {
    setAttempts(key, { count: 1, firstAt: now });
  } else {
    setAttempts(key, { count: a.count + 1, firstAt: a.firstAt || now });
  }
}

export function resetOtpAttempts(email) {
  try { localStorage.removeItem(`mt_otp_${email.toLowerCase().trim()}`); } catch {}
}
