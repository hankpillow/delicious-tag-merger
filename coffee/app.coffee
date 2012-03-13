# @author igor almeida
# @version 1.0
# TO-DO:
# - github
class TagMerger

	dom : {}
	merge_url:"/merge"
	messages:
		url_cont : "These tags were found in {count} urls."
		invalid : "You must choose a tag value before."
		empty_list : "You have nothing to merge."
		label_merge : "Merge"
		label_stop : "Stop"
		label_complete : "Clear"
		merge_complete : "Merge finished."
		system_error: "Error connecting to server. Try again later."
		service_error : "Service error. try again later!"
		parse_error : "Seems that Deliciou's API has changed. The xml can't be parsed properly. Try again later!"
		api_error : "Seems that Deliciou's API is offline.Try again later!"

	posts : undefined
	selection : undefined
	is_deleting : false
	tags_to_merge : 0

	constructor:()->

		this.dom.div = $("#step3")
		this.dom.tag_name = $("#tag_name")
		this.dom.tag_control = $("#tag_control")
		this.dom.tags = $("#tags_to_merge")
		this.dom.btn = $("#btn_merge")
		this.dom.form = $("#frm_merge")
		this.dom.status = $("#status_merge")
		this.dom.tag_count = $("#tag_count")
		this.dom.bar = $("#progress_bar")
		this.dom.progress = $("#progress_container")
		
		this.dom.tag_count.hide().fadeOut()
		this.dom.progress.hide().fadeOut()
		this.dom.status.hide().fadeOut()
		this.dom.div.hide().fadeOut()

		this.btn_status "merge"

		this.dom.form.unbind "submit"
		this.dom.form.bind "submit", (event) => 
			event.preventDefault()
			if this.is_deleting is true
				this.stop_merging()
				return
			else
				if this.dom.tag_name.val().length is 0
					this.dom.tag_control.addClass("error");
					this.merge_status this.messages.invalid , "alert-error"
					return
				this.dom.tag_control.removeClass("error");
				if this.selection is undefined or this.selection?.length is 0
					this.merge_status this.messages.empty_list , "alert-error"
					return
			this.merge_status undefined
			this.dom.tag_control.hide()
			this.dom.progress.show()
			this.tags_to_merge = this.selection.length
			this.start_merging()
	
	init : ( posts ) ->
		this.posts = posts
		this.dom.div.fadeIn "slow"

	stop_merging : (event)->
		this.merge_status undefined
		this.is_deleting = false;
		this.btn_status "merge"
		this.dom.tag_name.val ""
		this.dom.tag_control.show()
		this.dom.progress.hide()
		this.dom.bar.width("0%")
		window.tag_list?.unfreeze()

	start_merging : (event) ->
		this.dom.btn.fadeIn()
		this.btn_status "stop"
		this.is_deleting = true
		window.tag_list?.freeze()
		this.merge()

	merge : () ->

		if this.selection.length is 0
			this.merge_status this.messages.merge_complete, "alert-success"
			this.btn_status "complete"
			this.dom.bar.width("100%")
			$(tag).detach() for tag in this.dom.tags.find("a")
			return

		to_merge = this.selection.shift()
		percent = (this.tags_to_merge-this.selection.length)/this.tags_to_merge
		this.dom.bar.width("#{percent*100}%")

		$.ajax
			url: this.merge_url
			type: "POST"
			dataType:"json"
			success : (data) => this.handle_merge_parse data
			error : (data) => this.handle_merge_error data
			data:
				username : window.login.dom.user.val()
				password : window.login.dom.pass.val()
				old_tag : to_merge
				new_tag : this.dom.tag_name.val()

	handle_merge_error : (data)->
		this.stop_merging()
		this.merge_status this.messages.system_error, "alert-error"

	handle_merge_parse : (data)->

		if not data or not data.result or ( data.status_code isnt undefined and data.status_code isnt 0)
			this.stop_merging();
			this.merge_status (data.message or this.messages.service_error), "alert-error" 
			return

		try
			xml = $.parseXML data.result
			result_node  = $(xml).find( "result" ).get(0)
			code = $(result_node).attr("code")
		catch err
			this.stop_merging()
			this.merge_status this.messages.api_error, "alert-error"
			return

		if code is "done"
			this.merge_status undefined
			this.merge()
		else
			this.stop_merging()
			this.merge_status this.messages.api_error, "alert-error"

	merge_status : (msg,style) ->
		if msg is undefined
			this.dom.status.text("").fadeOut "fast"
			return
		this.dom.status.removeClass().addClass("alert "+style).text(msg).fadeIn "slow"

	btn_status :  (status) ->
		switch status
			when "merge"
				this.dom.btn.removeClass("btn-danger, btn-success").addClass("btn-primary")
				this.dom.btn.text this.messages.label_merge
			when "stop"
				this.dom.btn.removeClass("btn-primary, btn-success").addClass("btn-danger")
				this.dom.btn.text this.messages.label_stop
			when "complete"
				this.dom.btn.removeClass("btn-primary, btn-danger").addClass("btn-success")
				this.dom.btn.text this.messages.label_complete
	
	collect_urls : () ->
		this.selection  = ($(tag).text() for tag in this.dom.tags.find("a"))
		tag_count = []
		tag_count.push node for node in this.posts when tag in $(node).attr("tag").split(" ") for tag in this.selection
		if tag_count.length isnt 0 and this.selection.length isnt 0
			this.dom.tag_count.text(this.messages.url_cont.replace("{count}",tag_count.length)).fadeIn("slow")
		else
			this.dom.tag_count.text("").fadeOut "slow"

	add_tag: (tag = undefined)->
		return if this.is_deleting is true

		tag?.unbind("click").removeClass("btn-info").addClass("btn-danger")
		tag?.click () => 
			return if this.is_deleting is true
			window.tag_list?.add_tag tag
			this.collect_urls()
			
		this.dom.tags.append tag if tag isnt undefined
		this.collect_urls() if tag isnt undefined

	dispose : () ->
		this.stop_merging()
		this.dom.tag_count.text("").fadeOut()
		this.dom.progress.fadeOut()
		this.dom.bar.width("0%")
		this.dom.status.fadeOut()
		this.dom.div.hide()
		this.posts = undefined
		this.selection  = undefined
		$(tag).detach() for tag in this.dom.tags.find("a")

class TagList

	dom : {}

	constructor:(  ) ->
		this.dom.div = $("#step2")
		this.dom.tags = $("#tag_list")
		this.dom.div.hide().fadeOut()

	init:( list ) ->
		this.dom.div.fadeIn "slow"
		list.sort()
		this.add_tag $("<a data-index='#{index}' class='btn btn-mini btn-info tag'>#{tag}</a>"),false for tag,index in list when tag.length>0

	freeze : ( )->
		this.dom.tags.find( "a" ).each (value) ->
			$(this).removeClass("btn-info")
		
	unfreeze : ( )->
		this.dom.tags.find( "a" ).each (value) ->
			$(this).addClass("btn-info");

	add_tag: ( tag, sort=true ) ->
		return if tag is undefined

		tag.unbind("click").removeClass("btn-danger").addClass("btn-info")
		tag.click (value) => window.tag_merger?.add_tag tag

		target_index = Number($(tag).attr('data-index'))
		all_indexes = this.dom.tags.find("a")

		if all_indexes.length > 1 and sort is true
			all_tags = (Number($(item).attr("data-index")) for item in all_indexes)
			greater = undefined
			for value in all_tags
				break if greater isnt undefined
				greater = value if value>target_index
			if greater is undefined
				this.dom.tags.append tag
			else
				this.dom.tags.find("a[data-index='#{greater}']").before(tag)
		else
			this.dom.tags.append tag

	dispose: ()->
		$(tag).detach() for tag in this.dom.tags.find("a")
		this.dom.div.hide()
	
class Login

	dom : {}
	login_url : "/login"

	messages : 
		invalid: "Check the username and password."
		system_error: "Error connecting to server. Try again later."
		connecting_api : "Connecting to server."
		service_error : "Service error. try again later!"
		parse_error : "Seems that Deliciou's API has changed. The xml can't be parsed properly. Try again later!"
		api_error : "Seems that Deliciou's API is offline.Try again later!"
		label_login : "Login"
		label_connecting : "Conecting"
		label_logout: "Logout"
		hello: "Hello "

	init : () ->
		this.dom.div = $("#step1")
		this.dom.user = $("#delicious_user")
		this.dom.pass = $("#delicious_pass")
		this.dom.status = $("#login_status")
		this.dom.btn = $("#btn_login")
		this.dom.user_name = $("#delicious_name")
		this.dom.form = $("#frm_login")
		this.dom.fields = $("#frm_login fieldset")

		this.dom.user.parent().removeClass("error") 
		this.dom.pass.parent().removeClass("error")

		this.dom.form.unbind "submit" 
		this.dom.form.bind "submit", ( event ) =>
			event?.preventDefault( )
			if this.status is "logout"
				this.logout() 
			else
				this.login()
		this.btn_status "login"

	btn_status :  (_status) ->
		this.status = _status
		switch this.status
			when "logout"
				this.dom.btn.removeClass("active btn-primary").addClass("btn-danger")
				this.dom.btn.val this.messages.label_logout
			when "connecting"
				this.dom.btn.addClass "active"
				this.dom.btn.val this.messages.label_connecting
			when "login"
				this.dom.btn.removeClass("active btn-danger").addClass("btn-primary");
				this.dom.btn.val this.messages.label_login

	form_status : (msg,style) ->
		if msg is undefined
			this.dom.status.text("").fadeOut();
			return
		this.dom.status.removeClass().addClass("show alert "+style).text(msg).fadeIn();

	logout : () ->
		this.dom.user_name.text ""
		this.dom.user.val ""
		this.dom.pass.val ""
		this.dom.user_name.fadeOut()
		this.dom.fields.fadeIn()
		this.init();
		window.tag_list?.dispose()
		window.tag_merger?.dispose()

	login : ( ) ->

		if this.dom.user.val().length is 0
			this.dom.user.parent().addClass("error");
			this.form_status this.messages.invalid , "alert-error"
			return
		this.dom.user.parent().removeClass("error");

		if this.dom.pass.val().length is 0
			this.dom.pass.parent().addClass("error")
			this.form_status this.messages.invalid , "alert-error"
			return
		this.dom.pass.parent().removeClass("error");

		this.btn_status "connecting"
		this.form_status this.messages.connecting_api, "alert-info"

		$.ajax
			url: this.login_url
			type: "POST"
			dataType:"json"
			success : (data) => this.handle_login_parse data
			error : (data) => this.handle_login_error data
			data:
				username : this.dom.user.val()
				password : this.dom.pass.val()
				start : 0

	handle_login_error : (data) ->
		this.form_status this.messages.system_error, "alert-error"

	handle_login_parse : (data) ->

		if not data or not data.result or ( data.status_code isnt undefined and data.status_code isnt 0)
			this.form_status (data.message or this.messages.service_error), "alert-error" 
			this.btn_status "login"
			return

		try
			xml = $.parseXML data.result
		catch err
			this.form_status this.messages.api_error, "alert-error"
			this.btn_status "login"
			return

		result_node  = $(xml).find( "result" ).get(0)

		if result_node
			this.form_status "Delious API says: "+$(result_node).attr("code"), "alert-error"
			this.btn_status "login"
			return

		posts = $(xml).find("posts").get(0);
		if not posts
			this.form_status messages.parse_error, "alert-error" 
			this.btn_status "login"
			return

		this.btn_status "logout"
		this.form_status undefined

		this.dom.fields.fadeOut();
		this.dom.user_name.text ( this.messages.hello + $(posts).attr "user" )
		this.dom.user_name.fadeIn()
		
		posts_list = $(posts).find("post")
		tags = []
		tags.push tag for tag in $(value).attr("tag").split(" ") when tag not in tags for value in posts_list
		window.tag_merger.init posts_list
		window.tag_list.init tags

window.login = new Login
window.tag_merger = new TagMerger
window.tag_list = new TagList