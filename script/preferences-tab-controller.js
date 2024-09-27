import TabController from "../../../tool/tab-controller.js";


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
	get avatarChooser () { return this.center.querySelector("div.avatar>input"); }
	get addButton () { return this.center.querySelector("fieldset.phones>button.add"); }
	get submitButton () { return this.center.querySelector("div.control>button.submit"); }
	

	/**
	 * Handles that activity has changed from false to true.
	 */
	processActivated () {
		this.messageOutput.value = "";
		
		// redefine center content
		const template = document.querySelector("head>template.preferences");
		while (this.center.lastElementChild) this.center.lastElementChild.remove();
		this.center.append(template.content.firstElementChild.cloneNode(true));

		// register basic event listeners
		const sessionOwner = this.sharedProperties["session-owner"];
		this.avatarButton.addEventListener("click", event => this.avatarChooser.click());
		this.avatarChooser.addEventListener("change", event => this.processSubmitSessionOwnerAvatar(sessionOwner, event.target.files[0]));
		this.addButton.addEventListener("click", event => this.processAddPhoneInput(sessionOwner));
		this.submitButton.addEventListener("click", event => this.processSubmitSessionOwner(sessionOwner));
	}

	async previewPersonDetails () {
	
		
	}
	async processAddPhoneInput (sessionOwner) {
		const email = this.preferencesSection.querySelector("div.credentials>div>input.email");
		email.value = sessionOwner.email;
		this.preferencesSection.querySelector("div.credentials>div>input.email").value = sessionOwner.email;
		this.preferencesSection.querySelector("div.credentials>div>select.group").value = sessionOwner.group;
		this.preferencesSection.querySelector("div.personal>span.name>div>input.title").value = sessionOwner.name.title || "no title";
		this.preferencesSection.querySelector("div.personal>span.name>div>input.surname").value = sessionOwner.name.family;
		this.preferencesSection.querySelector("div.personal>span.name>div>input.forename").value = sessionOwner.name.given;
		this.preferencesSection.querySelector("div.personal>span.name>div>input.forename").value = sessionOwner.address.postcode;
		this.preferencesSection.querySelector("div.personal>span.address>div>input.street").value = sessionOwner.address.street;
		this.preferencesSection.querySelector("div.personal>span.address>div>input.city").value = sessionOwner.address.city;
		this.preferencesSection.querySelector("div.personal>span.address>div>input.country").value = sessionOwner.address.country;
	}


	async processSubmitSessionOwner (sessionOwner) {
		sessionOwner.email = this.preferencesSection.querySelector("div.credentials>div>input.email").value.trim();
		sessionOwner.group = this.preferencesSection.querySelector("div.credentials>div>select.group").value;
		sessionOwner.name.title = this.preferencesSection.querySelector("div.personal>span.name>div>input.title").value.trim() || null;
		sessionOwner.name.family = this.preferencesSection.querySelector("div.personal>span.name>div>input.surname").value.trim();
		sessionOwner.name.given = this.preferencesSection.querySelector("div.personal>span.name>div>input.forename").value.trim();
		sessionOwner.address.postcode = this.preferencesSection.querySelector("div.personal>span.name>div>input.forename").value.trim();
		sessionOwner.address.street = this.preferencesSection.querySelector("div.personal>span.address>div>input.street").value.trim();
		sessionOwner.address.city = this.preferencesSection.querySelector("div.personal>span.address>div>input.city").value.trim();
		sessionOwner.address.country = this.preferencesSection.querySelector("div.personal>span.address>div>input.country").value.trim();
		console.log(sessionOwner.address.country);
	}


	async processSubmitSessionOwnerAvatar (sessionOwner,avatarFile) {
		console.log("avatarFilessssssss",avatarFile.name);
		this.messageOutput.value = "";
		console.log(sessionOwner, avatarFile);
		const resource = this.sharedProperties["service-origin"] + "/services/documents?" + avatarFile.name.toString();
		console.log("resourcee",resource,avatarFile.type);
		const headers = { "Accept": "text/plain", "Content-Type": avatarFile.type};
		const response = await fetch(resource, { method: "POST" , headers: headers, body: avatarFile, credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
		sessionOwner.avatar.identity = parseInt(await response.text());
		this.preferencesSection.querySelector("div.avatar>button>img").src = this.sharedProperties["service-origin"] + "/services/documents/" + sessionOwner.avatar.identity;
		this.messageOutput.value = "ok.";
	}
}


/*
 * Registers an event listener for the browser window's load event.
 */
window.addEventListener("load", event => {
	const controller = new PreferencesTabController();
	console.log(controller);
});
