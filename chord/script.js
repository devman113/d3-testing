////////////////////////////////////////////////////////////
//////////////////////// Set-Up ////////////////////////////
////////////////////////////////////////////////////////////

function update(groupSet) {
	d3.select("svg").remove();
	var colors = ["#301E1E", "#083E77", "#342350", "#567235", "#8B161C", "#DF7C00"];
	var opacityDefault = 0.8;
	var totalSubCategories = [];
	var totalCategories = [];
	var totalIds = [];
	var totalAssociations = [];
	var groups = [];
	var startIndex = 0;
	for (var i = 0; i < groupSet.length; i++) {
	  totalSubCategories = totalSubCategories.concat(groupSet[i].subCategories);
	  for (var j = 0; j < groupSet[i].subCategories.length; j++)
		  totalCategories.push(groupSet[i].category);
		  
		totalIds = totalIds.concat(groupSet[i].ids);
		totalAssociations = totalAssociations.concat(groupSet[i].associationsList);

	  var endIndex = startIndex + groupSet[i].subCategories.length - 1;
	  groups.push({
		sIndex: startIndex,
		eIndex: endIndex,
		title: groupSet[i].category,
		color: colors[i%6]
	  })
	  startIndex = endIndex+1;
	}

	var Names = totalSubCategories;

	var matrix = [];
	for (var i = 0; i < totalSubCategories.length; i++) {
		matrix[i] = [];
		for (var j = 0; j < totalSubCategories.length; j++)
	  		matrix[i][j] = 0;
	}

	for (var i = 0; i < totalIds.length; i++) {
		var eachAssociations = totalAssociations[i];
		for (var j = 0; j < eachAssociations.length; j++) {
			var index = totalIds.indexOf(eachAssociations[j]);
			matrix[i][index] = 1;
		}
	}

	var margin = {left: 100, top: 100, right: 200, bottom: 200},
		width = Math.min(window.innerWidth, 1000) - margin.left - margin.right,
		height = Math.min(window.innerWidth, 1000) - margin.top - margin.bottom,
		innerRadius = Math.min(width, height) * .39,
		outerRadius = innerRadius * 1.1;
		
	////////////////////////////////////////////////////////////
	/////////// Create scale and layout functions //////////////
	////////////////////////////////////////////////////////////

	var colors = d3.scaleOrdinal()
		.domain(d3.range(Names.length))
		.range(colors);

	//A "custom" d3 chord function that automatically sorts the order of the chords in such a manner to reduce overlap	
	var chord = customChordLayout()
		.padding(.01)
		.sortChords(d3.descending) //which chord should be shown on top when chords cross. Now the biggest chord is at the bottom
		.matrix(matrix);
			
	var arc = d3.arc()
		.innerRadius(innerRadius*1.01)
		.outerRadius(outerRadius);

	var path = d3.ribbon()
		.radius(innerRadius);

	var tooltip = d3.select("#chart")
		.append("div")
		.attr("class", "tooltip")
		.text("");
		
	////////////////////////////////////////////////////////////
	////////////////////// Create SVG //////////////////////////
	////////////////////////////////////////////////////////////
		
	var svg = d3.select("#chart").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.attr("id", "svg_board")
		.append("g")
		.attr("transform", "translate(" + (width/2 + margin.left) + "," + (height/2 + margin.top) + ")");

	////////////////////////////////////////////////////////////
	/////////////// Create the gradient fills //////////////////
	////////////////////////////////////////////////////////////

	//Function to create the id for each chord gradient
	function getGradID(d){ return "linkGrad-" + d.source.index + "-" + d.target.index; }

	//Create the gradients definitions for each chord
	var grads = svg.append("defs").selectAll("linearGradient")
		.data(chord.chords())
	.enter().append("linearGradient")
		.attr("id", getGradID)
		.attr("gradientUnits", "userSpaceOnUse")
		.attr("x1", function(d,i) { return innerRadius * Math.cos((d.source.endAngle-d.source.startAngle)/2 + d.source.startAngle - Math.PI/2); })
		.attr("y1", function(d,i) { return innerRadius * Math.sin((d.source.endAngle-d.source.startAngle)/2 + d.source.startAngle - Math.PI/2); })
		.attr("x2", function(d,i) { return innerRadius * Math.cos((d.target.endAngle-d.target.startAngle)/2 + d.target.startAngle - Math.PI/2); })
		.attr("y2", function(d,i) { return innerRadius * Math.sin((d.target.endAngle-d.target.startAngle)/2 + d.target.startAngle - Math.PI/2); })

	//Set the starting color (at 0%)
	grads.append("stop")
		.attr("offset", "0%")
		.attr("stop-color", function(d){ return colors(d.source.index); });

	//Set the ending color (at 100%)
	grads.append("stop")
		.attr("offset", "100%")
		.attr("stop-color", function(d){ return colors(d.target.index); });
			
	////////////////////////////////////////////////////////////
	////////////////// Draw outer Arcs /////////////////////////
	////////////////////////////////////////////////////////////

	var outerArcs = svg.selectAll("g.group")
		.data(chord.groups)
		.enter().append("g")
		.attr("class", "group")
		.on("mouseover", arcMouseover)
		.on("mouseout", arcMouseout);

	outerArcs.append("path")
		.style("fill", function(d) { return colors(d.index); })
		.attr("d", arc)
		.each(function(d,i) {
			//Search pattern for everything between the start and the first capital L
			var firstArcSection = /(^.+?)L/; 	

			//Grab everything up to the first Line statement
			var newArc = firstArcSection.exec( d3.select(this).attr("d") )[1];
			//Replace all the comma's so that IE can handle it
			newArc = newArc.replace(/,/g , " ");
			
			//If the end angle lies beyond a quarter of a circle (90 degrees or pi/2) 
			//flip the end and start position
			var angle = (d.endAngle + d.startAngle) / 2;
			if (angle > 90*Math.PI/180 & angle < 270*Math.PI/180) {
				var startLoc 	= /M(.*?)A/,		//Everything between the first capital M and first capital A
					middleLoc 	= /A(.*?)0 0 1/,	//Everything between the first capital A and 0 0 1
					endLoc 		= /0 0 1 (.*?)$/;	//Everything between the first 0 0 1 and the end of the string (denoted by $)
				//Flip the direction of the arc by switching the start en end point (and sweep flag)
				//of those elements that are below the horizontal line
				var newStart = endLoc.exec( newArc )[1];
				var newEnd = startLoc.exec( newArc )[1];
				var middleSec = middleLoc.exec( newArc )[1];
				
				//Build up the new arc notation, set the sweep-flag to 0
				newArc = "M" + newStart + "A" + middleSec + "0 0 0 " + newEnd;
			}//if
			
			//Create a new invisible arc that the text can flow along
			svg.append("path")
				.attr("class", "hiddenArcs")
				.attr("id", "arc"+i)
				.attr("d", newArc)
				.style("fill", "none");
		});

	////////////////////////////////////////////////////////////
	////////////////// Append Names ////////////////////////////
	////////////////////////////////////////////////////////////

	//Append the label names on the outside
	function wrap(startAngle, endAngle, title) {
		var arcLength = (endAngle - startAngle)*innerRadius;
		var charLength = 9;
		if (arcLength/charLength < title.length) {
			return title.substring(0, arcLength/charLength) + '...';
		}
		return title;
		
	}

	outerArcs.append("text")
		.attr("class", "titles")
		.attr("x", 5)
		.attr("dy", function(d,i) {
			var angle = (d.endAngle + d.startAngle) / 2;
			return (angle > 90*Math.PI/180 & angle < 270*Math.PI/180 ? -8 : 16); 
		})
		.style("font-size", "14px")
	.append("textPath")
		.attr('fill', '#fff')
		.attr("startOffset","50%")
		.style("text-anchor","middle")
		.attr("xlink:href",function(d,i){return "#arc"+i;})
		.text(function(d,i){ return wrap(d.startAngle, d.endAngle, Names[i]); });
		
	////////////////////////////////////////////////////////////
	////////////////// Draw inner chords ///////////////////////
	////////////////////////////////////////////////////////////
	
	svg.selectAll("path.chord")
		.data(chord.chords)
		.enter().append("path")
		.attr("class", "chord")
		.style("fill", function(d){ return "url(#" + getGradID(d) + ")"; })
		.style("opacity", opacityDefault)
		.attr("d", path)
		.on("mouseover", mouseoverChord)
		.on("mouseout", mouseoutChord);

	var chord1 = d3.chord()
		.padAngle(.01)
		.sortChords(d3.descending) //which chord should be shown on top when chords cross. Now the biggest chord is at the bottom
		
	var cD = chord1(matrix).groups;
    //draw arcs
    for(var i=0;i<groups.length;i++) {
      var __g = groups[i];
      var arc1 = d3.arc()
        .innerRadius(innerRadius*1.11)
        .outerRadius(outerRadius*1.1)
        .startAngle(cD[__g.sIndex].startAngle) 
		.endAngle(cD[__g.eIndex].endAngle);

	//   svg.append("path").attr("d", arc1).attr('fill', __g.color).attr('id', 'groupId' + i);
	svg.append("path")
		.style("fill",  __g.color)
		.attr("d", arc1)
		.each(function(d,ii) {
			//Search pattern for everything between the start and the first capital L
			var firstArcSection = /(^.+?)L/; 	

			//Grab everything up to the first Line statement
			var newArc = firstArcSection.exec( d3.select(this).attr("d") )[1];
			//Replace all the comma's so that IE can handle it
			newArc = newArc.replace(/,/g , " ");
			//If the end angle lies beyond a quarter of a circle (90 degrees or pi/2) 
			//flip the end and start position
			var angle = (cD[__g.eIndex].endAngle + cD[__g.sIndex].startAngle) / 2
			if (angle > 90*Math.PI/180 & angle < 270*Math.PI/180) {
				var startLoc 	= /M(.*?)A/,		//Everything between the first capital M and first capital A
					middleLoc 	= /A(.*?)0 0 1/,	//Everything between the first capital A and 0 0 1
					endLoc 		= /0 0 1 (.*?)$/;	//Everything between the first 0 0 1 and the end of the string (denoted by $)
				//Flip the direction of the arc by switching the start en end point (and sweep flag)
				//of those elements that are below the horizontal line
				var newStart = endLoc.exec( newArc ); 
				var newEnd = startLoc.exec( newArc );
				var middleSec = middleLoc.exec( newArc );
				//Build up the new arc notation, set the sweep-flag to 0
				if (newStart && newEnd && middleSec)
				newArc = "M" + newStart[1] + "A" + middleSec[1] + "0 0 0 " + newEnd[1];
			}//if
			
			//Create a new invisible arc that the text can flow along
			svg.append("path")
				.attr("class", "hiddenArcs")
				.attr("id", "arcO"+i)
				.attr("d", newArc)
				.style("fill", "none");
		});
      
      // Add a text label.
      var text = svg.append("text")
		.attr("x", 5)
		.attr("dy", function(d,i) { 
			var angle = (cD[__g.eIndex].endAngle + cD[__g.sIndex].startAngle) / 2;
			var angleDiff = (cD[__g.eIndex].endAngle - cD[__g.sIndex].startAngle);
			if (angleDiff > Math.PI) return 18;
			var offset = (angle > 90*Math.PI/180 & angle < 270*Math.PI/180 ? -8 : 18); 
			return offset;
		})
        .style("font-size", "15px");

	  text.append("textPath")
		.attr('fill', '#fff')
		.attr("startOffset","50%")
		.style("text-anchor","middle")
        .attr("xlink:href","#arcO" + i)
		.text(function(d,i){ return wrap(cD[__g.sIndex].startAngle, cD[__g.eIndex].endAngle, __g.title); });


	}
	svg.selectAll("g.group")
	.data(cD)
	.enter().append("g")
	.attr("class", "group")
	.on("mouseover", arcMouseover)
	.on("mouseout", arcMouseout);
	////////////////////////////////////////////////////////////
	////////////////// Extra Functions /////////////////////////
	////////////////////////////////////////////////////////////

	//Returns an event handler for fading a given chord group.
	function fade(opacity, index) {
		svg.selectAll("path.chord")
			.filter(function(d, i) { return d.source.index !== index && d.target.index !== index; })
			.transition()
			.style("opacity", opacity);
	}//fade

	//Highlight hovered over chord
	function mouseoverChord(d,i) {
	
		//Decrease opacity to all
		svg.selectAll("path.chord")
			.transition()
			.style("opacity", 0.1);
		//Show hovered over chord with full opacity
		d3.select(this)
			.transition()
			.style("opacity", 1);
	}//mouseoverChord

	//Bring all chords back to default opacity
	function mouseoutChord(d) {
		//Set opacity back to default for all
		svg.selectAll("path.chord")
			.transition()
			.style("opacity", opacityDefault);
	}//function mouseoutChord
	function arcMouseover(d) {
		fade(.1, d.index);
		var x = d3.event.pageX - document.getElementById("svg_board").getBoundingClientRect().x + 10
		var y = d3.event.pageY - document.getElementById("svg_board").getBoundingClientRect().y + 10
		var width = document.getElementById("svg_board").getBoundingClientRect().width;
		var height = document.getElementById("svg_board").getBoundingClientRect().height;
		var offsetX = 0, offsetY = 0;
		if (x < width/2) {
			offsetX = -100;
			if (y < height/2) offsetY = -100;
			else offsetY = 20;
		}
		if (x > width/2) {
			offsetX = 50;
			if (y < height/2) offsetY = -100;
			else offsetY = 20;
		}

		tooltip.style("margin-left", x+offsetX+"px");
		tooltip.style("margin-top", y+offsetY+"px");
		tooltip.style("visibility", "visible");
		tooltip.html(getTooltipcontent(d.index));
	}
	function arcMouseout(d) {
		fade(opacityDefault, d.index);
		tooltip.style("visibility", "hidden");
	}
	function getTooltipcontent(index) {
		var content = '';
		var singleLine = function (val, title) {
			var content = "<div style='display: table-row;'>";
			content += "<span style='display: table-cell;'>"+title+": </span><br />";
			content += "<span style='display: table-cell;'>"+val+"</span><br />";
			content += "</div>"
			return content;
		}
		for (var i=0; i<totalSubCategories.length; i++) {
			if (i === index) {
				if (totalCategories[i])	content +=  singleLine(totalCategories[i], "Category");
				if (totalSubCategories[i])	content += singleLine(totalSubCategories[i], "Subitem");
			}
		}
		return content;
	}
}