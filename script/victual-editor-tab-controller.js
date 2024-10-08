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

		return victuals;
	}

	async #processDisplayVictualEditor(victual = {}) {
		// Hide the victuals view and show the editor
		this.viewSection.classList.add("hidden");
	
		// Insert new editor section
		const template = document.querySelector("head>template.victual-editor");
		const tableRow = template.content.firstElementChild.cloneNode(true);
		this.center.append(tableRow);
	
		// Avatar handling
		const avatarElement = tableRow.querySelector("div.data>div.avatar>button>img");
		avatarElement.addEventListener("dragover", event => this.#avatarAnrufenDrag(event.dataTransfer));
		avatarElement.addEventListener("drop", event => this.processSubmitVictualAvatar(victual, event.dataTransfer.files[0]));
	
		// Set a default avatar if none is available
		if (victual.avatar && victual.avatar.identity) {
			avatarElement.src = this.sharedProperties["service-origin"] + "/services/documents/" + victual.avatar.identity;
			console.log("avatarElement.srcavatarElement.srcavatarElement.srcavatarElement.src",avatarElement.src);
		} else {
			// Set a default avatar image
			avatarElement.src = this.sharedProperties["service-origin"] + "/services/documents/" + 1; 
		}
	
		// Set up cancel button
		tableRow.querySelector("div.control>button.cancel").addEventListener("click", event => this.#processReturnToVictual());
	
		// Set default value for the dropdown (select) and textarea
		const dietSelect = tableRow.querySelector("div.data>div.diet>select");
		const aliasInput = tableRow.querySelector("div.data>div.alias>input");
		const descriptionTextarea = tableRow.querySelector("div.data>div.description>textarea");
	
		// Set a default diet value to 'VEGAN' (assuming it's part of your DIET enum)
		dietSelect.value = victual.diet;
	
		// Set a default alias and description if none exist
		aliasInput.value = victual.alias || "";
		descriptionTextarea.value = victual.description || "Enter a description here...";
	
		// Register event listeners for the submit and delete buttons
		tableRow.querySelector("div.control>button.submit").addEventListener("click", event => this.#processSaveVictualEditor(victual));
		tableRow.querySelector("div.control>button.delete").addEventListener("click", event => this.#processDeleteVictualEditor(victual));
	
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
		const sessionOwner = this.sharedProperties["session-owner"] ;

		try {

			victual.avatar = victual.avatar || { identity: 1 };
			const avatarViewer2 = this.viewSectionVictualEditor.querySelector("div.data>div.avatar>button>img");

			avatarViewer2.src = this.sharedProperties["service-origin"] + "/services/documents/" + victual.avatar.identity;

			console.log("new victual avatar", victual.avatar );

			victual.diet = this.victualDiet.value || null;
			victual.alias = this.victualAlias.value || null;
			victual.description = this.victualDescription.value || null;

			console.log("new victual avatar",victual);

			victual.identity = await this.#invokeInsertOrUpdateVictual(victual);
			victual.version = (victual.version || 0) + 1;
			console.log("victual ", victual);	

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
		const resource = this.sharedProperties["service-origin"] + "/services/victuals";
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
		this.viewSectionVictualEditor.remove();
		this.refreshVictualsList();
	}


	async #processDeleteVictualEditor(victual) {

		try {

			const resource = this.sharedProperties["service-origin"] + "/services/victuals/" + victual.identity;
			const response = await fetch(resource, { method: "DELETE", credentials: "include" });
	
			if (!response.ok) {
				throw new Error("Failed to delete victual: HTTP " + response.status + " " + response.statusText);
			}
	
			await this.refreshVictualsList();
			this.viewSectionVictualEditor.classList.add("hidden");

			//return to the victuals list
			//this.#processReturnToVictual();

			// Refresh the victuals list after successful deletion

			this.messageOutput.value = "Victual deleted successfully.";
	
			console.log("Victual " + victual.identity + " deleted successfully.");
		} catch (error) {
			this.messageOutput.value = error.message;
			console.error("Error deleting victual:", error);
		}
	}
	
	async refreshVictualsList() {
		const sessionOwner = this.sharedProperties["session-owner"];
		// Clear the existing table rows
		this.victualsTableBody.innerHTML = '';  
		// Fetch and display editable victuals
		await this.displayEditableVictuals(sessionOwner);


	}
	

}
/*
 * Registers an event listener for the browser window's load event.
 */
window.addEventListener("load", event => {
	const controller = new VictualEditorTabController();
	console.log(controller);
});