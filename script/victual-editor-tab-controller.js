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
	get viewSectionVictualEditor () { return this.center.querySelector("section.victual-editor"); }
	get victualsTableBody () { return this.viewSection.querySelector("div.victuals>table>tbody"); }
	get controlDivision () { return this.viewSection.querySelector("div.control"); }
	get victualDiet () { return this.viewSectionVictualEditor.querySelector("div.data>div.diet>select"); }
    get victualAlias () { return this.viewSectionVictualEditor.querySelector("div.data>div.alias>input"); }
	get victualDescription () { return this.viewSectionVictualEditor.querySelector("div.data>div.description>textarea"); }


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
	
			console.log("save the updated victual to the database");
			

			
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
		// Clear out the existing editor, if any, to avoid appending multiple times
		const existingEditor = this.viewSectionVictualEditor;
		if (existingEditor) {
			existingEditor.remove();  // Remove existing editor before adding new one
		}
	
		// Hide the view section and prepare to display the editor
		this.viewSection.classList.add("hidden");
	
		// Insert new editor section
		const template = document.querySelector("head>template.victual-editor");
		const tableRow = template.content.firstElementChild.cloneNode(true);
		this.center.append(tableRow);
	
		// Setup event listeners and fill data in the editor
		const avatarElement = tableRow.querySelector("div.data>div.avatar>button>img");
		avatarElement.addEventListener("dragover", event => this.#avatarAnrufenDrag(event.dataTransfer));
		avatarElement.addEventListener("drop", event => this.processSubmitVictualAvatar(victual, event.dataTransfer.files[0]));
	
		tableRow.querySelector("div.control>button.cancel").addEventListener("click", event => this.#processReturnToVictual());
	
		if (victual.avatar && victual.avatar.identity) {
			avatarElement.src = this.sharedProperties["service-origin"] + "/services/documents/" + victual.avatar.identity;
		}
	
		tableRow.querySelector("div.data>div.diet>select").value = victual.diet || "";
		tableRow.querySelector("div.data>div.alias>input").value = victual.alias || "";
		tableRow.querySelector("div.data>div.description>textarea").value = victual.description;
	
		tableRow.querySelector("div.control>button.submit").addEventListener("click", event => this.#processSaveVictualEditor(victual));
	
		console.log("Editor displayed successfully.");
	}
	

	async processSubmitVictualAvatar(victual, avatarFile) {
		try {
			if (!avatarFile.type.startsWith("image/")) {
				throw new Error("Invalid file type. Only image files are allowed.");
			}
	
			// Upload the image and get the new identity
			victual.avatar = victual.avatar || { identity: 1 };
			victual.avatar.identity = await this.#invokeInsertOrUpdateDocument(avatarFile);
			const avatarViewer1 = this.viewSectionVictualEditor.querySelector("div.data>div.avatar>button>img");
			// Update the image source after the avatar has been successfully uploaded
			console.log("victual Avatr Identity",victual.avatar.identity);
			avatarViewer1.src = this.sharedProperties["service-origin"] + "/services/documents/" + victual.avatar.identity;
			this.messageOutput.value = "Avatar updated successfully.";
		} catch (error) {
			this.messageOutput.value = error.message;
			console.error(error);
		}
	}


	async #processSaveVictualEditor(victual){


		try {
			const victualClone =  structuredClone(victual);
			//console.log("victualClone",victualClone);
			victualClone.avatar = victual.avatar || { identity: 1 };
			console.log("victual.avatar identity check", victualClone.avatar,victual.avatar);
			//victualClone.avatar.identity = this.viewSectionVictualEditor.querySelector("div.data>div.avatar>button>img").value || "";
			victualClone.diet = this.victualDiet.value || "";
			victualClone.alias = this.victualAlias.value || "";
			victualClone.description = this.victualDescription.value || "";

			console.log("new victual avatar",victualClone);

			
			await this.#invokeInsertOrUpdateVictual(victualClone);

			
			for (const key in victualClone)
				victual[key] = victualClone[key];
			victual.version +=1;	

			// Return to the victuals list after saving
			this.#processReturnToVictual();

			this.messageOutput.value = "ok";
		} catch (error) {
			//this.displayPersonDetails(sessionOwner);
			this.messageOutput.value = error.message;
			console.error(error);
		}
	}

	async #invokeInsertOrUpdateVictual (victualOwnerClone) {
		const body = JSON.stringify(victualOwnerClone);
		console.log("bodyyyyyyyyyyyyyyyyyy",body);
		const resource = sessionOwner.group === "ADMIN"
		? this.sharedProperties["service-origin"] + "/services/victuals"
		: this.sharedProperties["service-origin"] + "/services/people/" + victualOwnerClone.identity + "/victuals";
		const headers = { "Accept": "text/plain", "Content-Type": "application/json" };
		const response = await fetch(resource, { method: "POST", headers: headers, body: body, credentials: "include" });
		console.log("response",response);
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);

		return window.parseInt(await response.text());
	}
	

	async #invokeInsertOrUpdateDocument (file) {
		const resource = this.sharedProperties["service-origin"] + "/services/documents";
		const headers = { "Accept": "text/plain", "Content-Type": file.type, "X-Content-Description": file.name };
		const response = await fetch(resource, { method: "POST" , headers: headers, body: file, credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
		console.log("copied to database");
		return window.parseInt(await response.text());
	}
	

	async #avatarAnrufenDrag(dataTransferObject){
		dataTransferObject.dropEffect = "copy";
		console.log("copiedddd");
	}

	async #processReturnToVictual() {
		// Show the victuals view section
		this.viewSection.classList.remove("hidden");
	
		// Remove the editor from the DOM if it exists
		const existingEditor = this.viewSectionVictualEditor;
		if (existingEditor) {
			existingEditor.remove();  // This will remove the editor from the DOM
		}
	}
	

}
/*
 * Registers an event listener for the browser window's load event.
 */
window.addEventListener("load", event => {
	const controller = new VictualEditorTabController();
	console.log(controller);
});
