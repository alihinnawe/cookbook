import TabController from "../../../tool/tab-controller.js";
import {sleep} from "../../../tool/threads.js";

/**
 * Skeleton for tab controller type.
 */
class PreferencesTabController extends TabController {


	/**
	 * Initializes a new instance.
	 */
	constructor () {
		super("preferences");

		// register controller event listeners 
		this.addEventListener("activated", event => this.processActivated());
	}


	// HTML element getter operations
	get preferencesSection () { return this.center.querySelector("section.preferences"); }
	get avatarButton () { return this.center.querySelector("div.avatar>button"); }
	get avatarViewer () { return this.avatarButton.querySelector("img"); }
	get avatarChooser () { return this.center.querySelector("div.avatar>input"); }
	get addButton () { return this.center.querySelector("fieldset.phones>button.add"); }
	get submitButton () { return this.center.querySelector("div.control>button.submit"); }
	get phonesSpan() { return this.preferencesSection.querySelector("fieldset.phones>span"); }
	get emailInput() { return this.preferencesSection.querySelector("div.credentials>div.email>input"); } 
	get passwordInput() { return this.preferencesSection.querySelector("div.credentials>div.password>input"); } 
	get groupSelector() { return this.preferencesSection.querySelector("div.credentials>div.group>select"); }
	get titleInput() { return this.preferencesSection.querySelector("div.personal>span.name>div.title>input"); }
	get surnameInput() { return this.preferencesSection.querySelector("div.personal>span.name>div.surname>input"); }
	get forenameInput() { return this.preferencesSection.querySelector("div.personal>span.name>div.forename>input"); }
	get postcodeInput () { return this.preferencesSection.querySelector("div.personal>span.address>div.postcode>input"); }
	get streetInput () { return this.preferencesSection.querySelector("div.personal>span.address>div.street>input"); }
	get cityInput () { return this.preferencesSection.querySelector("div.personal>span.address>div.city>input"); }
	get countryInput () { return this.preferencesSection.querySelector("div.personal>span.address>div.country>input"); }


	/**
	 * Handles that activity has changed from false to true.
	 */
	processActivated () {
		this.messageOutput.value = "";
		
		// redefine center content
		const template = document.querySelector("head>template.preferences");
		while (this.center.lastElementChild) this.center.lastElementChild.remove();
		this.center.append(template.content.firstElementChild.cloneNode(true));
		
		const newButton = document.createElement("button");
		newButton.type = "button";
		newButton.innerText = "neu";
		newButton.classList.add("create");
		
		
		// register basic event listeners
		const sessionOwner = this.sharedProperties["session-owner"];
		console.log("sessionOwner",sessionOwner);
		
		this.avatarButton.addEventListener("click", event => this.avatarChooser.click());
		this.avatarChooser.addEventListener("change", event => this.processSubmitSessionOwnerAvatar(sessionOwner, event.target.files[0]));
		this.addButton.addEventListener("click", event => this.processAddPhoneInput());
		this.submitButton.addEventListener("click", event => this.processSubmitSessionOwner(sessionOwner));
		this.avatarViewer.addEventListener("dragover", event => this.#avatarAnrufenDrag(event.dataTransfer));
		this.avatarViewer.addEventListener("drop", event => this.processSubmitSessionOwnerAvatar(sessionOwner, event.dataTransfer.files[0]));

		this.displayPersonDetails (sessionOwner);
	}	

	async displayPersonDetails (sessionOwner) {
		this.avatarViewer.src = this.sharedProperties["service-origin"] + "/services/documents/" + sessionOwner.avatar.identity;
		this.emailInput.value = sessionOwner.email || "";
		this.groupSelector.value = sessionOwner.group;
		this.titleInput.value = sessionOwner.name.title || "";
		this.surnameInput.value = sessionOwner.name.family || "";
		this.forenameInput.value = sessionOwner.name.given || "";
		this.postcodeInput.value = sessionOwner.address.postcode || "";
		this.streetInput.value = sessionOwner.address.street || "";
		this.cityInput.value = sessionOwner.address.city || "";
		this.countryInput.value = sessionOwner.address.country || "";

		this.phonesSpan.innerHTML = "";
		for (const phone of sessionOwner.phones){
			this.processAddPhoneInput(phone);
		}

		if(sessionOwner.group != "ADMIN") this.groupSelector.disabled = true;
        sleep(500);
		this.passwordInput.value = "";
	}


	async processAddPhoneInput (phone = null) {
		const phoneInput = document.createElement("input");
		phoneInput.type = "tel";
		phoneInput.value = phone || "";
		this.phonesSpan.append(phoneInput);
	}


	async processSubmitSessionOwner (sessionOwner) {
		try {
			const password = this.passwordInput.value.trim() || null;
			const sessionOwnerClone =  structuredClone(sessionOwner);
			sessionOwnerClone.email = this.emailInput.value.trim() || null;
			sessionOwnerClone.group = this.groupSelector.value || null;
			sessionOwnerClone.name.title = this.titleInput.value.trim() || null;
			sessionOwnerClone.name.family = this.surnameInput.value.trim() || null;
			sessionOwnerClone.name.given = this.forenameInput.value.trim() || null;
			sessionOwnerClone.address.postcode = this.postcodeInput.value.trim() || null;
			sessionOwnerClone.address.street = this.streetInput.value.trim() || null;
			sessionOwnerClone.address.city = this.cityInput.value.trim() || null;
			sessionOwnerClone.address.country = this.countryInput.value.trim() || null;

			sessionOwnerClone.phones.length=0;
			for (const phoneInput of this.phonesSpan.querySelectorAll("input")){
				const phone = phoneInput.value.trim() || null;
				if (phone) sessionOwnerClone.phones.push(phone);
			}; 
			
			await this.#invokeInsertOrUpdatePerson(sessionOwnerClone, password);

			if (sessionOwnerClone.email != sessionOwner.email || password) {
				document.querySelector("header>nav.tabs>button.authentication").click();
			} else {
				for (const key in sessionOwnerClone)
					sessionOwner[key] = sessionOwnerClone[key];
				sessionOwner.version +=1;
			}		

			this.messageOutput.value = "ok";
		} catch (error) {
			this.displayPersonDetails(sessionOwner);
			this.messageOutput.value = error.message;
			console.error(error);
		}
	}


	async processSubmitSessionOwnerAvatar (sessionOwner, avatarFile) {
		
		
		try {
			
			if (!avatarFile.type.startsWith("image/")) {
            throw new Error("Invalid file type. Only image files are allowed.");
			}

			sessionOwner.avatar.identity = await this.#invokeInsertOrUpdateDocument(avatarFile);
			this.avatarViewer.src = this.sharedProperties["service-origin"] + "/services/documents/" + sessionOwner.avatar.identity;

			this.messageOutput.value = "ok.";
		} catch (error) {
			this.displayPersonDetails(sessionOwner);
			this.messageOutput.value = error.message;
			console.error(error);
		}		
	}

	async #invokeInsertOrUpdatePerson (sessionOwnerClone,password) {
		const body = JSON.stringify(sessionOwnerClone);
		const resource = this.sharedProperties["service-origin"] + "/services/people";
		const headers = { "Accept": "text/plain", "Content-Type": "application/json" };
		if (password) headers["X-Set-Password"] = password;
		const response = await fetch(resource, { method: "POST", headers: headers, body: body, credentials: "include" });
		//console.log("response",response);
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);

		return window.parseInt(await response.text());
	}

	async #invokeInsertOrUpdateDocument (file) {
		const resource = this.sharedProperties["service-origin"] + "/services/documents";
		const headers = { "Accept": "text/plain", "Content-Type": file.type, "X-Content-Description": file.name };
		const response = await fetch(resource, { method: "POST" , headers: headers, body: file, credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);

		return window.parseInt(await response.text());
	}
	
	async #avatarAnrufenDrag(dataTransferObject){

			dataTransferObject.dropEffect = "copy";
	}
}


/*
 * Registers an event listener for the browser window's load event.
 */
window.addEventListener("load", event => {
	const controller = new PreferencesTabController();
	console.log(controller);
});