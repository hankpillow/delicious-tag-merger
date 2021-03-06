from google.appengine.api import urlfetch
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from xml.dom.minidom import parseString

import re, base64, cgitb, urllib, cgi, logging
import simplejson as json

class MainHandler(webapp.RequestHandler):
	
	def get(self):
		self.response.headers['Content-Type'] = 'application/json'
		self.response.out.write( json.dumps({"status_code":-1,"message":"post only dude!"}) )

	def post(self):

		self.response.headers['Content-Type'] = 'application/json'
		cgitb.enable()
		params = cgi.FieldStorage()

		encoded_credencial = params.getvalue("credencials")
		if (encoded_credencial == None):
			self.response.out.write( json.dumps({"status_code":-2,"message":"empty user"}) )
			return

		old_tag = params.getvalue("old_tag")
		if (old_tag == None):
			self.response.out.write( json.dumps({"status_code":-4,"message":"null old_tag"}) )
			return
			
		new_tag = params.getvalue("new_tag")
		if (new_tag == None):
			self.response.out.write( json.dumps({"status_code":-5,"message":"null new_tag"}) )
			return

		response = {}
		try:
			result = urlfetch.fetch(url=("https://api.del.icio.us/v1/tags/rename?old="+old_tag+"&new="+new_tag),headers={"Authorization": "Basic %s" % encoded_credencial},deadline=60, allow_truncated=True)
			response = {"status_code":0,"result":result.content}
		except Exception, e:
			response = {"status_code":-10, "message":"%s" % e, "url":url}

		self.response.out.write( json.dumps(response) )

def main(has_debug=False):
    application = webapp.WSGIApplication([('/merge', MainHandler)],debug=has_debug)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main(True)