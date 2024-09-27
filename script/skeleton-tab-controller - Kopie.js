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
		console.log("test");

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

	
	async processAddPhoneInput () {}


	async processSubmitSessionOwner (sessionOwner) {
		console.log(sessionOwner);	
	}


	async processSubmitSessionOwnerAvatar (sessionOwner,avatarFile) {
		console.log(sessionOwner, avatarFile);	
	}
}


/*
 * Registers an event listener for the browser window's load event.
 */
window.addEventListener("load", event => {
	const controller = new PreferencesTabController();
	console.log(controller);
});
