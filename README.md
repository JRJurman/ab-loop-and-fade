# ab-loop-and-fade

Tiny Web App for AB Looping and Cross fade for Background music tracks

<!-- from dialog component -->
<h2>What is A-B Loop and Crossfade?</h2>
<p>
	This web application is a tool for quickly creating background loops with tracks that might otherwise have a
	natural fade at the start and end of the track.
</p>
<p style="font-style: italic">This application collects no data and runs entirely local to your computer.</p>
<h2>How do I use this?</h2>
<ol>
	<li>Select an audio file you have access to on your computer.</li>
	<li>Drag the Point A and Point B sliders to the start and end of where you want the loop to be.</li>
	<li>Hit the play button on either of track players!</li>
</ol>
<p>
	After doing the above, you should hear the track play. Once the player reaches your "Point B" timestamp, it will
	start to fade the current track and start up the track on the second player, starting at your "Point A"
	timestamp. This will repeat between both players until you pause, or enable "Passthrough".
</p>
<h2>What are these controls?</h2>
<p>
	<strong>Master Volume - </strong>
	Since each track needs to dynamically change its volume up and down, we have a master control at the top so you
	can set the max volume of both at once.
</p>
<p>
	<strong>Point A and Point B - </strong>
	The start and end of your loop. When one of the players hits "Point B", the other player will start playing at
	"Point A".
</p>
<p>
	<strong>Passthrough - </strong>
	If this is enabled, we will stop looping, and allow the player to continue to the end. This is useful if you
	want the track to naturally stop.
</p>
<p>
	<strong>Crossfade - </strong>
	How long you want both of the tracks to be playing on top of each other. A longer crossfade can make the
	transition feel more seamless.
</p>
