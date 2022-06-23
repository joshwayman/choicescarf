function pokemon(baseSpeed, iv, lvl, ev, nature, scarf, boost, tailwind, ability) {
    if(typeof scarf === "undefined") {
        scarf = false;
    }
    if(typeof boost === "undefined") {
        boost = 0;
    }
    if(typeof tailwind === "undefined") {
        tailwind = false;
    }
    if(typeof ability === "undefined") {
        ability = false;
    }
    
    this.bs = baseSpeed,
    this.iv = iv,
    this.ev = ev,
    this.lvl = lvl,
    this.nature = nature,
    this.scarf = scarf,
    this.boost = boost,
    this.tailwind = tailwind,
    this.ability = ability;
}

function calcSpeed(mon) {
    speed = ((((mon.iv + 2*mon.bs + mon.ev/4)*mon.lvl)/100)+5) * mon.nature
    
    if(mon.scarf === true) {
        speed = speed * 1.5;
    }
    
    if(mon.tailwind === true) {
        speed = speed * 2;
    }
    
    if(mon.ability === true) {
        speed = speed * 2;
    }
    
    switch(mon.boost) {
        case -6:
            speed = speed * (2/8);
            break;
        case -5:
            speed = speed * (2/7);
            break;
        case -4:
            speed = speed * (2/6);
            break;
        case -3:
            speed = speed * (2/5);
            break;
        case -2:
            speed = speed * (2/4);
            break;
        case -1:
            speed = speed * (2/3);
            break;
        case 0:
            break;
        case 1:
            speed = speed * (3/2);
            break;
        case 2:
            speed = speed * (4/2);
            break;
        case 3:
            speed = speed * (5/2);
            break;
        case 4:
            speed = speed * (6/2);
            break;
        case 5:
            speed = speed * (7/2);
            break;
        case 6:
            speed = speed * (8/2);
            break;
    }
    
    return mon.speed = Math.floor(speed);
}
/*
var monA = new pokemon(100, 31, 50, 252, 1.1),
    monB = new pokemon(102, 31, 50, "x", "x"),
    monC = new pokemon(102, 31, 50, 252, 1.1),
    monD = new pokemon(56, 31, 50, "x", "x"),
    monE = new pokemon(20, 31, 50, "x", "x", false, 0, false, false);

calcSpeed(monA);
calcSpeed(monB);
calcSpeed(monC);
calcSpeed(monD);
calcSpeed(monE); */

function comparePokemon(pokemonA, pokemonB) {
    if(pokemonA.speed < pokemonB.speed) {
        return true;
    } else if(pokemonA.speed >= pokemonB.speed) {
        return false;
    }
}

function evHunter(pokemonA, pokemonB) {
    // Set NaN to 0 and 0.9 respectively
    pokemonB.ev = 0,
    pokemonB.nature = 0.9;
    
    var evB = pokemonB.ev,
        natureB = pokemonB.nature;
        
    
    // Calc pokemon speeds
    calcSpeed(pokemonA);
    calcSpeed(pokemonB);
    
    var speedA = pokemonA.speed;

    // Start the Hunt - initital sweep before moving to more complicated checks
    function theHunt() {  
        evLoop:
        for(i = 0; i < 253; i += 4) {
            
            pokemonB.ev = i;
            
            // Calc speed with variables
            calcSpeed(pokemonB);

            
            // Calc the speed for each for iteration
            var theCalc = comparePokemon(pokemonA, pokemonB);

            if(theCalc === true) {
                //document.getElementById("explaination").innerHTML=("evs required are " + pokemonB.ev + ", speed is " + pokemonB.speed + ", nature is " + pokemonB.nature + " scarf required = " + pokemonB.scarf );
                console.log("faster!");
                
                if(pokemonB.nature === 0.9 ) {
                   var natureWord = "negative"
                } else if(pokemonB.nature === 1) {
                    var natureWord = "neutral"
                } else if(pokemonB.nature === 1.1) {
                    var natureWord = "positive"
                } else {
                    var natureWord = "something went wrong"
                }
                
                if(pokemonB.scarf === true) {
                    var scarfWord = "A Choice Scarf is required"
                } else if(pokemonB.scarf === false) {
                    var scarfWord = "No Choice Scarf needed"
                } else {
                    var scarfWord = "something went wrong"
                }
                
                document.getElementById("reqNature").innerHTML=natureWord,
                document.getElementById("reqEvs").innerHTML=pokemonB.ev,
                document.getElementById("reqScarf").innerHTML=scarfWord;

                return pokemonB;
                break evLoop;

            } else if(theCalc === false) {
    
                // If 252 ev is hit without outspeeding, return false
                if(pokemonB.ev === 252 && theCalc === false) {
                    //console.log("nope! Can't outspeed");
                    return false;
                    break evLoop;
                }
            } else {
                console.log("something broke");
            }  
        }
    }

    // This loop tests the nature
    natureLoop:
    while(theHunt() === false) {
        switch(theHunt()) {
            // if true print ev and speed
            case true:
                break natureLoop;
                break;

            case false:
                // try new nature on falure
                //console.log("new nature");
                
                // Nature with no scarf
                if(pokemonB.nature === 0.9 && pokemonB.scarf === false) {
                    pokemonB.nature = 1;
                    
                } else if(pokemonB.nature === 1 && pokemonB.scarf === false) {
                    pokemonB.nature = 1.1;
                    
                } else if(pokemonB.nature === 1.1 && pokemonB.scarf === false) {
                   
                    // if impossible reset nature and break out of loop
                    //console.log("scarf required");
                    pokemonB.nature = 0.9;
                    pokemonB.scarf = true;

                // Nature with scarf
                } else if(pokemonB.nature === 0.9 && pokemonB.scarf === true) {
                    pokemonB.nature = 1.0;
                } else if(pokemonB.nature === 1 && pokemonB.scarf === true) {
                    pokemonB.nature = 1.1;
                } else if(pokemonB.nature === 1.1 && pokemonB.scarf === true) {
                    console.log("not even a scarf will do it");
                    return false;
                    break natureLoop;
                }
                break;

            default:
                break;
        }
    }
}

function getCheckedRadioId(name) {
    var elements = document.getElementsByName(name);

    for (var i=0, len=elements.length; i<len; ++i)
        if (elements[i].checked) return elements[i].value;
}

function gottaPimpEmAll() {
    
    // grab all the data!
    
    //pokemon A
    var bsA = Number($("#bs1").val()),
        ivA = Number($("#ivs1").val()),
        evA = Number($("#evs1").val()),
        natureA = Number(getCheckedRadioId("nature")),
        levelA = Number($("#level1").val()),
        boostA = Number($("#boostsA").val()),
        scarfA = $("#scarfA")[0].checked,
        tailA = $("#tailA")[0].checked,
        abilityA = $("#abilityA")[0].checked;
    
    //pokemon B
    var bsB =  Number($("#bs2").val()),
        ivB =  Number($("#ivs2").val()),
        levelB = Number($("#level2").val()),
        boostB = Number($("#boostsB").val()),
        scarfB = $("#scarfB")[0].checked,
        tailB = $("#tailB")[0].checked,
        abilityB =  $("#abilityB")[0].checked;
    
    //baseSpeed, iv, lvl, ev, nature, scarf, boost, tailwind, ability
    var monA = new pokemon(
        bsA, ivA, levelA, evA, natureA, scarfA, boostA, tailA, abilityA
    )
    var monB = new pokemon(
        bsB, ivB, levelB, "x", 0.9, scarfB, boostB, tailB, abilityB
    )
    
    evHunter(monA, monB);
    console.log(monA);
    console.log(monB);
    
    return monB;
}

// JQuery Stuff


$("#advancedChecker").change(function() {
    if(this.checked) {
        $("#advancedContent").slideDown();
    } else {
        $("#advancedContent").slideUp();
    }
    
});

$("#theGoButton").click(function() {
    gottaPimpEmAll();
    event.preventDefault();
});