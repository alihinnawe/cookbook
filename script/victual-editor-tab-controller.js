import TabController from "../../../tool/tab-controller.js";


/**
 * Skeleton for tab controller type.
 */
class VictualEditorTabController extends TabController {


	/**
	 * Initializes a new instance.
	 */
	constructor () {
		super("victual-editor");

		// register controller event listeners 
		this.addEventListener("activated", event => this.processActivated());
	}


	// HTML element getter operations
	get viewSection () { return this.center.querySelector("section.victuals-view"); }
	get victualsTableBody () { return this.viewSection.querySelector("div.victuals>table>tbody"); }

	/**
	 * Handles that activity has changed from false to true.
	 */
	processActivated () {
		this.messageOutput.value = "";

		// redefine center content
		const template = document.querySelector("head>template.victuals-view");
		while (this.center.lastElementChild) this.center.lastElementChild.remove();
		this.center.append(template.content.firstElementChild.cloneNode(true));

		// register basic event listeners
		const sessionOwner = this.sharedProperties["session-owner"] ;
		console.log("x",this.victualsTableBody);
		this.displayEditableVictuals(sessionOwner);
		console.log("five");
	}
	
	async displayEditableVictuals(sessionOwner){
		const victuals = await this.#invokeQueryEditableVictuals(sessionOwner);
		
		const template = document.querySelector("head>template.victuals-view-row");
		for (const victual of victuals) {
			const tableRow = template.content.firstElementChild.cloneNode(true);
			this.victualsTableBody.append(tableRow);
			
			
		}
	}
	
	//
	async #invokeQueryEditableVictuals(sessionOwner){
			
			const resource = sessionOwner.group === "ADMIN"
			? this.sharedProperties["service-origin"] + "/services/victuals"
			: this.sharedProperties["service-origin"] + "/services/people/" + sessionOwner.identity + "/victuals";
		const headers = { "Accept": "application/json" };
		const response = await fetch(resource, { method: "GET", headers: headers, credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
		const victuals = await response.json();
		console.log(victuals);
		// redefine center content
		return victuals;
	}
}


/*
 * Registers an event listener for the browser window's load event.
 */
window.addEventListener("load", event => {
	const controller = new VictualEditorTabController();
	console.log(controller);
});
