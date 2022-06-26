function pokemon3() {
    
    this.stats = {};
    this.mods = {};
    this.util = {};
    this.natures = {};
    this.evs = {};
    
    // Methods
    this.mBuild = function(type) {
        this.util.type = type;
        
        function transform(n) {
            switch ( n ) {
                case -6:
                    return 2/8; 
                    break;
                case -5:
                    return 2/7;
                    break;
                case -4:
                    return 2/6;
                    break;
                case -3:
                    return 2/5;
                    break;
                case -2:
                    return 2/4;
                    break;
                case -1:
                    return 2/3;
                    break;
                case 0:
                    return 2/2;
                    break;
                case 1:
                    return 3/2;
                    break;
                case 2:
                    return 4/2;
                    break;
                case 3:
                    return 5/2;
                    break;
                case 4:
                    return 6/2;
                    break;
                case 5:
                    return 7/2;
                    break;
                case 6:
                    return 8/2;
                    break;
            }
        }
        
        if ( type == "a" ) {
            
            this.stats.bs = Number($("#bs1").val());
            this.stats.iv = Number($("#ivs1").val());
            this.stats.ev = Number($("#evs1").val());
            this.stats.nature = Number(getCheckedRadioId("nature"));
            this.stats.lvl = Number($("#level1").val());
            
            this.mods.boost = transform(Number($("#boostsA").val()));
            this.mods.scarf = $("#scarfA")[0].checked;
            this.mods.tail = $("#tailA")[0].checked;
            this.mods.ability = $("#abilityA")[0].checked;
            
        } else {
            
            this.stats.bs = Number($("#bs2").val());
            this.stats.iv = Number($("#ivs2").val());
            this.stats.ev = 0;
            this.stats.nature = 0.9;
            this.stats.lvl = Number($("#level2").val());
            
            this.mods.boost = transform(Number($("#boostsB").val()));
            this.mods.scarf = $("#scarfB")[0].checked;
            this.mods.tail = $("#tailB")[0].checked;
            this.mods.ability =  $("#abilityB")[0].checked;
            
        }
    }
    
    this.mBaseCalc = function() {
        
        this.stats.speed = Math.floor(((((this.stats.iv + 2*this.stats.bs + this.stats.ev/4)*this.stats.lvl)/100)+5) * this.stats.nature * this.mods.boost);
        
        if(this.mods.scarf === true) {
            this.stats.speed = Math.floor(this.stats.speed * 1.5); }
        
        if(this.mods.tail === true) {
            this.stats.speed = Math.floor(this.stats.speed * 2); }
        
        if(this.mods.ability === true) {
            this.stats.speed = Math.floor(this.stats.speed * 2); }
        
        return this.stats.speed;
    }
    
    this.mBruteCalc = function(pk) {
        this.stats.speed = 0;
        //var speed = this.stats.speed;
        var other = pk.stats.speed;
        var speed = 0,
            scarf = 1,
            prelim = ((((this.stats.iv + 2*this.stats.bs + 252/4)*this.stats.lvl)/100)+5) * 1.1 + this.mods.boost;
        
        // Consider mods
        if(this.mods.tail === true) {
            prelim = Math.floor(prelim * 2); }

        if(this.mods.ability === true) {
            prelim = Math.floor(prelim * 2); }

        
        if ( (prelim < other) && (this.mods.scarf == false) ) {
            scarf = 1.5;
            console.log("SCARF MODE ACTIVATE!");
            this.mods.scarf = true;
        }
        
        //console.log("Speed to be is " + other);
        
        negLoop:
        for (var i = 0; i < 253; i += 4) {
            speed = Math.floor(((((this.stats.iv + 2*this.stats.bs + i/4)*this.stats.lvl)/100)+5) * 0.9 * this.mods.boost);
            
            // Consider mods
            if(this.mods.scarf === true) {
                speed = Math.floor(speed * 1.5); }
            else {
                speed = Math.floor(speed * scarf);
            }
        
            if(this.mods.tail === true) {
                speed = Math.floor(speed * 2); }
        
            if(this.mods.ability === true) {
                speed = Math.floor(speed * 2); }
            
            
            
            
            if(speed > other) {
                this.evs.neg = i;
                this.natures.neg = speed;
                
                //console.log("Neg - Speed: " + speed + " EVs: " + i);
                break negLoop;
            } else if ( i == 252 ) {
                this.evs.neg = i;
                this.natures.neg = speed;
                //console.log("Neg - Speed: " + speed + " EVs: " + i);
            }
        }
        
        var speed = 0;
        
        neuLoop:
        for (var j = 0; j < 253; j += 4) {
            speed = Math.floor(((((this.stats.iv + 2*this.stats.bs + j/4)*this.stats.lvl)/100)+5) * 1 * this.mods.boost);
            
            // Consider mods
            if(this.mods.scarf === true) {
                speed = Math.floor(speed * 1.5); }
            else {  
                speed = Math.floor(speed * scarf);
            }
        
            if(this.mods.tail === true) {
                speed = Math.floor(speed * 2); }
        
            if(this.mods.ability === true) {
                speed = Math.floor(speed * 2); }
            
            
            
            if(speed > other) {
                this.evs.neu = j;
                this.natures.neu = speed;
                
                //console.log("Neu - Speed: " + speed + " EVs: " + j);
                break neuLoop;
            } else if ( j == 252 ) {
                this.evs.neu = j;
                this.natures.neu = speed;
                //console.log("Neu - Speed: " + speed + " EVs: " + j);
            }
        }
        
        var speed = 0;
        
        posLoop:
        for (var k = 0; k < 253; k += 4) {
            speed = Math.floor(((((this.stats.iv + 2*this.stats.bs + k/4)*this.stats.lvl)/100)+5) * 1.1 * this.mods.boost);
            
            // Consider mods
            if(this.mods.scarf === true) {
                speed = Math.floor(speed * 1.5); }
            else {
                speed = Math.floor(speed * scarf);
            }
        
            if(this.mods.tail === true) {
                speed = Math.floor(speed * 2); }
        
            if(this.mods.ability === true) {
                speed = Math.floor(speed * 2); }
            
            
            if(speed > other) {
                this.evs.pos = k;
                this.natures.pos = speed;
                
               // console.log("Pos - Speed: " + speed + " EVs: " + k);
                break posLoop;
            } else if ( k == 252 ) {
                this.evs.pos = k;
                this.natures.pos = speed;
                //console.log("Pos - Speed: " + speed + " EVs: " + k);
            }
        }
        
        
        /*
        baseLoop:
        for (var i = 0; i < 253; i += 4) {
            speed = ((((this.stats.iv + 2*this.stats.bs + i/4)*this.stats.lvl)/100)+5) * this.stats.nature;
            
            if(speed > other) {
                this.stats.speed = speed;
                this.stats.ev = i;
                
                natureSwitch:
                switch ( this.stats.nature ) {
                    case 0.9:
                        this.natures.neg = speed;
                        this.evs.neg = i;
                        
                        this.stats.nature = 1;
                        i = 0;
                        
                        break natureSwitch;
                        
                    case 1:
                        this.natures.neu = speed;
                        this.evs.neu = i;
                        
                        this.stats.nature = 1.1;
                        i = 0;
                        
                        break natureSwitch;
                        
                    case 1.1:
                        this.natures.pos = speed;
                        this.evs.pos = i;
                        
                        break baseLoop;
                        break natureSwitch;
                        
                    default:
                        break natureSwitch;
                }
                
                
                console.log("Found, speed to beat was " + other);
                console.log("Neg: " + this.evs.neg + " Speed: " + this.natures.neg);
                console.log("Neu: " + this.evs.neu + " Speed: " + this.natures.neu);
                console.log("Pos: " + this.evs.pos + " Speed: " + this.natures.pos);
                
                
            } else if (i == 252 && speed < pk.stats.speed && this.stats.nature == 0.9) {
                this.stats.nature = 1;
                this.natures.neg = speed;
                this.evs.neg = i;
                
                i = 0;
                
            } else if (i == 252 && speed < pk.stats.speed && this.stats.nature == 1) {
                this.stats.nature = 1.1;
                this.natures.neu = speed;
                this.evs.neu = i;
                
                i = 0;
                
            } else if (i == 252 && speed < pk.stats.speed && this.stats.nature == 1.1) {
                this.natures.pos = speed;
                this.evs.pos = i;
                
                console.log("Bust");
                console.log("Neg: " + this.natures.neg);
                console.log("Neu: " + this.natures.neu);
                console.log("Pos: " + this.natures.pos);
            }
        } */
    }
    
    // Temp
    /*
    this.stats.bs = 100;
    this.stats.iv = 31;
    this.stats.ev = 252;
    this.stats.nature = 1;
    this.stats.lvl = 50; */
    
    // var x = ((((31 + 2*100 + 252/4)*50/100)+5) * 1)
    
    // Calc the boosts - creates the boosts property
    this.mBoosts = function() { 
        // Set up boost logic
        
        var boosts = {};
            boosts["-6"] = 2/8;
            boosts["-5"] = 2/7;
            boosts["-4"] = 2/6;
            boosts["-3"] = 2/5;
            boosts["-2"] = 2/4;
            boosts["-1"] = 2/3;
            boosts["=0"] = 1;
            boosts["+1"] = 3/2;
            boosts["+2"] = 4/2;
            boosts["+3"] = 5/2;
            boosts["+4"] = 6/2;
            boosts["+5"] = 7/2;
            boosts["+6"] = 8/2;

    this.util.boosts = [];

    var boostsArr = this.util.boosts,
        speed = this.speed.raw;

        $.each( boosts, function( key, value ) {
           var obj = {};

           obj[key] = speed * value;

            boostsArr.push(obj);
        });
    }
}


function getCheckedRadioId(name) {
    var elements = document.getElementsByName(name);

    for (var i=0, len=elements.length; i<len; ++i)
        if (elements[i].checked) return elements[i].value;
}


function printResults() {
    var pkA = new pokemon3();
    var pkB = new pokemon3();
    
    
    pkA.mBuild("a");
    pkA.mBaseCalc();
    pkB.mBuild("b");
    pkB.mBruteCalc(pkA);
    
    
    console.log(pkB.mods.scarf);
    
    var mods = "";
    
    if(pkB.mods.scarf == true) {
        mods = "A Choice Scarf is required.";
        $(".scarfs").html('<img src="img/choice-scarf.png" class="img-responsive">');
    } else {
        $(".scarfs").html("");
    }
    
    $("#speedToBeat").html("The speed to beat was " + pkA.stats.speed + "."); 
    
    $("#evsPos").html(pkB.evs.pos); 
    $("#speedPos").html(pkB.natures.pos);
    
    $("#evsNeu").html(pkB.evs.neu); 
    $("#speedNeu").html(pkB.natures.neu);
    
    $("#evsNeg").html(pkB.evs.neg); 
    $("#speedNeg").html(pkB.natures.neg); 
    
    $("#modsB").html(mods);
    
    // remove colouring classes
    $("#tr-neg").removeClass();
    $("#tr-neu").removeClass();
    $("#tr-pos").removeClass();

    var speed = pkA.stats.speed;
    
    switch ( true ) {
        case ( speed == pkB.natures.pos ):
            $("#tr-pos").addClass("warning");   
            break;    
        case ( speed > pkB.natures.pos ):
            $("#tr-pos").addClass("danger");   
            break;
            
        default:
            $("#tr-pos").addClass("success");
            break;
    }
    
    switch ( true ) {
        case ( speed == pkB.natures.neu ):
            $("#tr-neu").addClass("warning");
            break;
        case ( speed > pkB.natures.neu ):
            $("#tr-neu").addClass("danger");
            break;

        default:
            $("#tr-neu").addClass("success");
            break;
    }
    
    switch ( true ) {
        case ( speed == pkB.natures.neg ):
            $("#tr-neg").addClass("warning");
            break;
        case ( speed > pkB.natures.neg ):
            $("#tr-neg").addClass("danger");
            break;
            
        default:
            $("#tr-neg").addClass("success");
            break;
    } 
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
    printResults();
    event.preventDefault();
});