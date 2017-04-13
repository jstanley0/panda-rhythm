require './main'
require 'babel/transpiler'
Dir.glob('public/*.jsx').each do |jsxfile|
  puts "Compiling #{jsxfile}"
  js = Babel::Transpiler.transform(File.read(jsxfile))
  File.write(jsxfile[0..-2], js['code'])
end
run Sinatra::Application
