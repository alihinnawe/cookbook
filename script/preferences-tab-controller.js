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
		//console.log(this.avatarButton,this.addButton,this.submitButton);
		const sessionOwner = this.sharedProperties["session-owner"];
		this.avatarButton.addEventListener("click", event => this.avatarChooser.click());
		this.avatarChooser.addEventListener("change", event => this.processSubmitSessionOwnerAvatar(sessionOwner, event.target.files[0]));
		this.addButton.addEventListener("click", event => this.processAddPhoneInput());
		this.submitButton.addEventListener("click", event => this.processSubmitSessionOwner(sessionOwner));
	}

	async previewPersonDetails () {
	
		
	}
	async processAddPhoneInput () {
		const sessionOwner = this.sharedProperties["session-owner"];
		const AvatarSelection = this.preferencesSection.querySelector("div.avatar>button>img");
		console.log("image",this.preferencesSection.querySelector("div.avatar>button>img").currentSrc);
		AvatarSelection.src = this.sharedProperties["service-origin"] + "/services/documents/" + sessionOwner.avatar.identity;
		console.log("image",this.preferencesSection.querySelector("div.avatar>button>img").currentSrc);

	}


	async processSubmitSessionOwner (sessionOwner) {
		console.log(sessionOwner.avatar.description);	
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
