import TabController from "../../../tool/tab-controller.js";
import {DIET} from "./enums.js"

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
	get controlDivision () { return this.viewSection.querySelector("div.control"); }


	/**
	 * Handles that activity has changed from false to true.
	 */
	processActivated () {
		this.messageOutput.value = "";

		// redefine center content
		const template = document.querySelector("head>template.victuals-view");
		while (this.center.lastElementChild) this.center.lastElementChild.remove();
		this.center.append(template.content.firstElementChild.cloneNode(true));

		const newButton = document.createElement("button");
		newButton.type = "button";
		newButton.innerText = "neu";
		newButton.classList.add("create");
		newButton.addEventListener("click", event => this.#processDisplayVictualEditor());
		this.controlDivision.append(newButton);

		// register basic event listeners
		const sessionOwner = this.sharedProperties["session-owner"] ;
		this.displayEditableVictuals(sessionOwner);

	}
	
	async displayEditableVictuals(sessionOwner) {
		const victuals = await this.#invokeQueryEditableVictuals(sessionOwner);
		
		const template = document.querySelector("head>template.victuals-view-row");
		// Loop over each victual and create a row for it
		for (const victual of victuals) {

			const tableRow = template.content.firstElementChild.cloneNode(true);
			
			// Find elements in the current cloned row
			const avatarElement = tableRow.querySelector("td.access>button>img");
			const rowAlias = tableRow.querySelector("td.alias.text");
			const rowDiet = tableRow.querySelector("td.diet");
			const dateAlias = tableRow.querySelector("td.modified.number");
			const button = tableRow.querySelector("td.access>button");
	
			avatarElement.src = this.sharedProperties["service-origin"] + "/services/documents/" + victual.avatar.identity;
			rowAlias.textContent = victual.alias || "";
			rowDiet.textContent = DIET[victual.diet] || "";
	
			const timestamp = victual.modified;
			const event = new Date(timestamp);
		
			dateAlias.textContent = event.toLocaleDateString();
			this.victualsTableBody.append(tableRow);

			button.addEventListener("click", event => this.#processDisplayVictualEditor(victual));
			

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
		// redefine center content
		return victuals;
	}

	async #processDisplayVictualEditor(victual = {}) {
		//console.log("victual",victual);
		this.viewSection.classList.add("hidden");
		const template = document.querySelector("head>template.victual-editor");
		const tableRow = template.content.firstElementChild.cloneNode(true);
		this.center.append(tableRow);
		const avatarElement = tableRow.querySelector("div.data>div.avatar>button>img");
		avatarElement.src = this.sharedProperties["service-origin"] + "/services/documents/" + victual.avatar.identity;
		tableRow.querySelector("div.data>div.diet>select").value = victual.diet || "";
		tableRow.querySelector("div.data>div.alias>input").value = victual.alias || "";
		tableRow.querySelector("div.data>div.description>textarea").value = victual.description;
	}



}


/*
 * Registers an event listener for the browser window's load event.
 */
window.addEventListener("load", event => {
	const controller = new VictualEditorTabController();
	console.log(controller);
});
