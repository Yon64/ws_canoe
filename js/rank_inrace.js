function OnOpenWebSocketCommand()
{
	wsContext.wsCommand.send(JSON.stringify({key:'<race_load>', key_race:'*' }));
}

function OnCommandRaceLoad(objJSON)
{
	wsContext.notify_race = objJSON;

	const tCompetition = adv.GetTable(objJSON, 'Competition');
	const tCompetition_Course = adv.GetTable(objJSON, 'Competition_Course');
	const tCompetition_Course_Phase = adv.GetTable(objJSON, 'Competition_Course_Phase');

//	document.querySelector("#head .name").innerHTML = tCompetition.GetCell('Nom', 0);
	document.querySelector("#head .place").innerHTML = ('CURRENT RANKING');
	//Phase
	document.querySelector("#head .title").innerHTML = tCompetition_Course_Phase.GetCell('Libelle', (canoe.GetCodePhase()-1));
	
	// Chargement de toutes les épreuves ...
	const cmd = { key : '<epreuve_load>',  epreuve : '' };	
	wsContext.wsCommand.send(JSON.stringify(cmd));
}

function OnCommandEpreuveLoad(objJSON)
{
	wsContext.notify_ranking = objJSON;

	const tRanking = adv.GetTableUnique(wsContext.notify_ranking, 'ranking');
	canoe.SetColumnNameRanking(tRanking);

	const course_phase = canoe.GetCodeCoursePhase();
	tRanking.OrderBy('Tps'+course_phase+', Dossard');
	
	if (wsContext.epreuve == '')
		SetCurrentEpreuve(tRanking);
	
	ShowRanking(tRanking);
}

function SetCurrentEpreuve(tRanking)
{
	const course_phase = canoe.GetCodeCoursePhase();
	var lastHeureDep = 0;

	wsContext.epreuve = '';
	wsContext.scroll_start = 0;
	
	for (let i=0;i<=tRanking.GetNbRows();i++)
	{
		if (tRanking.GetCellInt('Tps'+course_phase,i) >= adv.chrono.OK)
		{
			if (tRanking.GetCellInt('Heure_depart'+course_phase,i) > lastHeureDep)
			{
				lastHeureDep = tRanking.GetCellInt('Heure_depart'+course_phase,i);
				wsContext.epreuve = tRanking.GetCell('Code_categorie',i);
			}
		}
	}
	//catégorie
	//document.querySelector("#head .categ").innerHTML = ' - '+wsContext.epreuve;
}

function HideRow(row)
{
	document.querySelector('#block_ranking .row'+row).style.display = 'none';
}

function ShowRow(row)
{
	document.querySelector('#block_ranking .row'+row).style.display = 'block';
}

function HideRows()
{
	for (let i=1;i<=5;i++)
		HideRow(i);
}

function ShowRanking(tRanking)
{
	HideRows();
	if (tRanking && typeof tRanking === 'object')
	{
		const course_phase = canoe.GetCodeCoursePhase();

		var row = 1;
		var i = wsContext.scroll_start;
		while (row <= 5 && i < tRanking.GetNbRows())
		{
			if (tRanking.GetCell('Code_categorie', i) == wsContext.epreuve && 
				tRanking.GetCellInt('Tps'+course_phase,i, adv.chrono.KO) != adv.chrono.KO
			)
			{
				ShowRankingRow(row, tRanking, i, course_phase);
				++row;
			}
			++i;
		}
		
		if (GetCountRanking(tRanking, course_phase, i) > 0)
			wsContext.scroll_start = i;
		else
			wsContext.scroll_start = 0;
		
		
	}
}

function GetCountRanking(tRanking, course_phase, iStart)
{
	let count = 0;
	for (let i=iStart;i<=tRanking.GetNbRows();i++)
	{
		if (tRanking.GetCell('Code_categorie', i) == wsContext.epreuve && 
			tRanking.GetCellInt('Tps'+course_phase,i, adv.chrono.KO) != adv.chrono.KO
		)
		{
			++count;
		}
	}
	return count;
}

function  ShowRankingRow(row, tRanking, i, course_phase)
{
	if (tRanking.GetCellInt('Tps'+course_phase, i) > 0)
		document.querySelector('#block_ranking .row'+row+' .rank').innerHTML = tRanking.GetCell('Cltc'+course_phase, i);
	else
		document.querySelector('#block_ranking .row'+row+' .rank').innerHTML = '';
		
	document.querySelector('#block_ranking .row'+row+' .bib').innerHTML = tRanking.GetCell('Dossard', i);
	
	if (tRanking.GetCell('Bateau', i).length < 18){
		document.querySelector('#block_ranking .row'+row+' .identity').innerHTML = tRanking.GetCell('Bateau', i);
	}else{
		document.querySelector('#block_ranking .row'+row+' .identity').innerHTML = tRanking.GetCell('Bateau', i).substring(0,18)+'.';
	}
	
	const code_nation = tRanking.GetCell('Code_nation', i);

	if (code_nation.length > 0)
	{
		document.querySelector('#block_ranking .row'+row+' .img_nation').innerHTML = "<img src='./img/flags/"+code_nation+".png' height='20' width='30' />";
	}
	else
	{
		document.querySelector('#block_ranking .row'+row+' .img_nation').innerHTML = '';
	}
	document.querySelector('#block_ranking .row'+row+' .time').innerHTML = tRanking.GetCellChrono('Tps'+course_phase, i, 'HHMMSSCC');

	if (tRanking.GetCellInt('Tps'+course_phase, i) > 0){
		if (tRanking.GetCell('Cltc'+course_phase, i) != '1'){
			document.querySelector('#block_ranking .row'+row+' .diff').innerHTML = adv.GetChronoDiffXSCC(tRanking.GetDiffTime('Tps'+course_phase, i, 'Code_categorie'));
			document.querySelector('#block_ranking .row'+row+' .diff').style.color ='#e00000';
		}else{
			document.querySelector('#block_ranking .row'+row+' .diff').innerHTML = tRanking.GetCellChrono('Tps'+course_phase, i, 'XSCC');
			document.querySelector('#block_ranking .row'+row+' .diff').style.color ='#00195A';
		}
	}else{
		document.querySelector('#block_ranking .row'+row+' .diff').innerHTML = tRanking.GetCellChrono('Tps'+course_phase, i, 'HHMMSSCC');
		document.querySelector('#block_ranking .row'+row+' .diff').style.color ='#00195A';
	}

	ShowRow(row);
}

function Init()
{
	wsContext.lang = 'en';
	wsContext.url = wsParams.url;
	wsContext.port = wsParams.port;

	wsContext.epreuve = '';
	
	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);

	if (urlParams.has('epreuve'))
	{
		wsContext.epreuve = urlParams.get('epreuve');
		document.querySelector("#head .categ").innerHTML = ' - '+wsContext.epreuve;
	}
	
	wsContext.scroll_start = 0;
	wsContext.scroll_delay = 10000;
	
	// Command Notification
	wsContext.mapCommand.set('<race_load>', OnCommandRaceLoad);
	wsContext.mapCommand.set('<epreuve_load>', OnCommandEpreuveLoad);
	
	// Ouverture ws 
	wsContext.OpenWebSocketCommand(OnOpenWebSocketCommand);
}

