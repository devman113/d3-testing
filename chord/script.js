////////////////////////////////////////////////////////////
//////////////////////// Set-Up ////////////////////////////
////////////////////////////////////////////////////////////

function update(groupSet) {
	d3.select("svg").remove();

	var totalSubCategories = [];
	var totalIds = [];
	var totalAssociations = [];
	var groups = [];
	var startIndex = 0;
	for (var i = 0; i < groupSet.length; i++) {
	  totalSubCategories = totalSubCategories.concat(groupSet[i].subCategories);
	  totalIds = totalIds.concat(groupSet[i].ids);
	  totalAssociations = totalAssociations.concat(groupSet[i].associationsList);
	  var endIndex = startIndex + groupSet[i].subCategories.length - 1;
	  groups.push({
		sIndex: startIndex,
		eIndex: endIndex,
		title: groupSet[i].category,
		color: getRandomColor()
	  })
	  startIndex = endIndex+1;
	}

	var Names = totalSubCategories,
	  colors = ["#301E1E", "#083E77", "#342350", "#567235", "#8B161C", "#DF7C00"],
	  opacityDefault = 0.8;

	var matrix = [];
	for (var i = 0; i < totalSubCategories.length; i++) {
	  matrix[i] = [];
	}

	for (var i = 0; i < totalAssociations.length; i++) {
	  var eachAssociationList = totalAssociations[i];
	  for (var j = 0; j < totalIds.length; j++) {
		// if (eachAssociationList.indexOf(totalIds[j]) > -1)
		//   matrix[i][j] = 2;
		// else
		//   matrix[i][j] = 0;
		matrix[i][j] = 1;
	  }
	}

	var margin = {left:20, top:20, right:20, bottom:20},
		width = Math.min(window.innerWidth, 700) - margin.left - margin.right,
		height = Math.min(window.innerWidth, 700) - margin.top - margin.bottom,
		innerRadius = Math.min(width, height) * .39,
		outerRadius = innerRadius * 1.1;
		
	// var matrix = [
	// 	[1, 2, 0, 0, 0, 2, 0, 2, 0, 0, 0, 0, 0, 0],
	// 	[0, 2, 0, 0, 0, 2, 0, 2, 0, 0, 0, 0, 0, 0],
	// 	[0, 2, 1, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	// 	[0, 0, 0, 2, 0, 2, 0, 2, 2, 0, 0, 0, 0, 0],
	// 	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	// 	[0, 2, 0, 2, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0],
	// 	[0, 0, 0, 0, 2, 0, 0, 2, 0, 0, 0, 0, 0, 0],
	// 	[0, 0, 0, 2, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0],
	// 	[2, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0],
	// 	[0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	// 	[0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	// 	[0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0],
	// 	[0, 0, 2, 0, 0, 2, 0, 0, 0, 0, 2, 0, 2, 0],
	// 	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0],
	// ];

	console.log(Names, matrix);
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
		
	////////////////////////////////////////////////////////////
	////////////////////// Create SVG //////////////////////////
	////////////////////////////////////////////////////////////
		
	var svg = d3.select("#chart").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
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
		.on("mouseover", fade(.1))
		.on("mouseout", fade(opacityDefault));

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
			if (d.endAngle > 90*Math.PI/180 & d.startAngle < 270*Math.PI/180) {
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
	function wrap() {
		var self = d3.select(this),
		textLength = self.node().getComputedTextLength(),
		text = self.text();
		var w = self.node().getBoundingClientRect().width,
			h = self.node().getBoundingClientRect().height;
		while (textLength > Math.sqrt(w*w+h*h)*.8 && text.length > 0) {
		text = text.slice(0, -1);
		self.text(text + '...');
		textLength = self.node().getComputedTextLength();
		}
	}

	outerArcs.append("text")
		.attr("class", "titles")
		.attr("dy", function(d,i) { return (d.endAngle > 90*Math.PI/180 & d.startAngle < 270*Math.PI/180 ? -8 : 16); })
		.style("font-size", "14px")
	.append("textPath")
		.attr('fill', '#fff')
		.attr("startOffset","50%")
		.style("text-anchor","middle")
		.attr("xlink:href",function(d,i){return "#arc"+i;})
		.text(function(d,i){ return Names[i]; }).each(wrap);
		
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
		.sortChords(d3.descending);
		
	var cD = chord1(matrix).groups;
      
    //draw arcs
    for(var i=0;i<groups.length;i++) {
      var __g = groups[i];
      var arc1 = d3.arc()
        .innerRadius(innerRadius*1.11)
        .outerRadius(outerRadius*1.1)
        .startAngle(cD[__g.sIndex].startAngle) 
        .endAngle(cD[__g.eIndex].endAngle) 

      svg.append("path").attr("d", arc1).attr('fill', __g.color).attr('id', 'groupId' + i);
      
      // Add a text label.
      var text = svg.append("text")
        .attr("x", 10)
        .attr("dy", 20)
        .style("font-size", "15px");

      text.append("textPath")
        .attr('fill', '#fff')
        .attr("xlink:href","#groupId" + i)
        .text(__g.title).each(wrap);
    }

	////////////////////////////////////////////////////////////
	////////////////// Extra Functions /////////////////////////
	////////////////////////////////////////////////////////////

	//Returns an event handler for fading a given chord group.
	function fade(opacity) {
	return function(d,i) {
		svg.selectAll("path.chord")
			.filter(function(d) { return d.source.index !== i && d.target.index !== i; })
			.transition()
			.style("opacity", opacity);
	};
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
}