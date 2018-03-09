/*!
 * eMAG Apps UI KIT
 * Copyright 2011-2016 eMAG.
 * Licensed under MIT License
 */
var browserSync = require('browser-sync');
var uiKitName = require('./package.json').name;

module.exports = function (grunt) {

    require('time-grunt')(grunt);

    // Project configuration.
    grunt.initConfig({

        // Metadata.
        pkg: grunt.file.readJSON('package.json'),
        banner: '/*!\n' +
            ' * eMAG Apps UI KIT v<%= pkg.version %>' +
            ' * Copyright 2001-<%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
            ' * Licensed under the <%= pkg.license %> license\n' +
            ' */\n',
        // Task configuration:
        // Compiles the .less files into a readable .css file.
        less: {

            // The main stylesheet (main_style.css)
            frontend: {
                options: {
                  strictMath: true,
                  sourceMap: true,
                  outputSourceFiles: true,
                  sourceMapURL: 'main_style.css.map',
                  sourceMapFilename: '<%= pkg.dist_styles %>/main_style.css.map',
                  banner: '<%= banner %>'
                },
                src: '<%= pkg.data_styles %>/base/bootstrap.less',
                dest: '<%= pkg.dist_styles %>/main_style.css'
            },

            presentation_site: {
                options: {
                    strictMath: true,
                    sourceMap: true,
                    outputSourceFiles: true,
                    sourceMapURL: 'custom-presentation.css.map',
                    sourceMapFilename: '<%= pkg.dist_styles %>/custom-presentation.css.map',
                    banner: '<%= banner %>'
                },
                src: '<%= pkg.data_styles %>/base/custom/custom-presentation.less',
                dest: '<%= pkg.dist_styles %>/custom-presentation.css'
            },

            // The dark theme stylesheet (main_style_dark.css)
            frontend_dark: {
                options: {
                  strictMath: true,
                  sourceMap: true,
                  outputSourceFiles: true,
                  sourceMapURL: 'main_style_dark.css.map',
                  sourceMapFilename: '<%= pkg.dist_styles %>/main_style_dark.css.map',
                  banner: '<%= banner %>'
                },
                src: '<%= pkg.data_styles %>/base/dark/bootstrap_dark.less',
                dest: '<%= pkg.dist_styles %>/main_style_dark.css'
            },

            // Each plugin's less file is converted into a readable .css file.
            plugins: {
                options: {
                    strictMath: false,
                    sourceMap: false
                },
                files: {
                    '<%= pkg.dist_plugins %>/datetimepicker/bootstrap-datetimepicker.4.17.37.min.css':'<%= pkg.data_plugins %>/datetimepicker/less/bootstrap-datetimepicker.4.17.37.less',
                    '<%= pkg.dist_plugins %>/daterangepicker/daterangepicker.min.css':'<%= pkg.data_plugins %>/daterangepicker/less/daterangepicker.less',
                    '<%= pkg.dist_plugins %>/chosen/jQuery.chosen-1.4.2.min.css':'<%= pkg.data_plugins %>/chosen/less/custom-jQuery.chosen.less',
                    '<%= pkg.dist_plugins %>/selectize/selectize-0.12.0.min.css':'<%= pkg.data_plugins %>/selectize/less/custom-selectize.less',
                    '<%= pkg.dist_plugins %>/css3spinners/css3-spinners.1.2.2.min.css':'<%= pkg.data_plugins %>/css3spinners/less/css3-spinners.less',
                    '<%= pkg.dist_plugins %>/jqgrid/ui.jqgrid.min.css':'<%= pkg.data_plugins %>/jqgrid/less/custom-jqgrid.less',
                    '<%= pkg.dist_plugins %>/dropzone/dropzone.min.css':'<%= pkg.data_plugins %>/dropzone/less/dropzone.less',
                    '<%= pkg.dist_plugins %>/magnific/magnific.min.css':'<%= pkg.data_plugins %>/magnific/less/magnific.less',
                    '<%= pkg.dist_plugins %>/drop/drop.min.css':'<%= pkg.data_plugins %>/drop/less/drop.less',
                    '<%= pkg.dist_plugins %>/wizard/wizard.min.css':'<%= pkg.data_plugins %>/wizard/less/custom-wizard.less',
                    '<%= pkg.dist_plugins %>/chart/chart.min.css':'<%= pkg.data_plugins %>/chart/less/custom-chart.less',
                    '<%= pkg.dist_plugins %>/summernote/summernote.min.css':'<%= pkg.data_plugins %>/summernote/less/summernote.less',
                    '<%= pkg.dist_plugins %>/fancytree/fancytree.min.css':'<%= pkg.data_plugins %>/fancytree/less/ui.fancytree.less',
                    '<%= pkg.dist_plugins %>/prism/prism.min.css':'<%= pkg.data_plugins %>/prism/less/prism.less',
                    '<%= pkg.dist_plugins %>/intro/intro.min.css': ['<%= pkg.data_plugins %>/intro/less/introjs.less', '<%= pkg.data_plugins %>/intro/less/introjs.custom.less'],
                    '<%= pkg.dist_plugins %>/hierarchicalselect/hierarchicalselect.min.css': ['<%= pkg.data_plugins %>/hierarchicalselect/less/hierarchicalselect.less'],
                    '<%= pkg.dist_plugins %>/bootstrap-multiselect/bootstrap-multiselect.min.css': ['<%= pkg.data_plugins %>/bootstrap-multiselect/less/bootstrap-multiselect.less'],
                    '<%= pkg.dist_plugins %>/jquery-custom-scrollbar/jquery-custom-scrollbar-0.5.5.min.css':'<%= pkg.data_plugins %>/jquery-custom-scrollbar/less/jquery-custom-scrollbar-0.5.5.custom.less'
                }
            },

            jquery: {
                options: {
                    strictMath: true,
                    sourceMap: false
                },
                src: '<%= pkg.data_styles %>/lib/jquery_ui/less/all.less',
                dest: '<%= pkg.dist_styles %>/lib/jquery-ui-custom.1.11.4.min.css'
            }
        },
        lesslint: {
            src: [ '<%= changedFile %>' ]
        },
        // Post CSS Autoprefixer - adds browser-specific prefixes to standard CSS properties.
        autoprefixer: {
            options: {
                browsers: ['last 2 versions', 'ie 8', 'ie 9'],
                map: true
            },
            frontend: {
                src: '<%= pkg.dist_styles %>/main_style.css',
                dest: '<%= pkg.dist_styles %>/main_style.css'
            },
            presentation_site: {
                src: '<%= pkg.dist_styles %>/custom-presentation.css',
                dest: '<%= pkg.dist_styles %>/custom-presentation.css'
            },
            frontend_dark: {
                src: '<%= pkg.dist_styles %>/main_style_dark.css',
                dest: '<%= pkg.dist_styles %>/main_style_dark.css'
            }
        },



        // Minifies CSS files by overriding them
        cssmin: {
            options: {
                compatibility: 'ie8',
                keepSpecialComments: '*',
                sourceMap: false,
                advanced: false
            },
            frontend: {
                src:  '<%= pkg.dist_styles %>/main_style.css',
                dest: '<%= pkg.dist_styles %>/main_style.min.css'
            },
            presentation_site: {
                src:  '<%= pkg.dist_styles %>/custom-presentation.css',
                dest: '<%= pkg.dist_styles %>/custom-presentation.min.css'
            },
            frontend_dark: {
                src:  '<%= pkg.dist_styles %>/main_style_dark.css',
                dest: '<%= pkg.dist_styles %>/main_style_dark.min.css'
            },
            plugins: {
                files: {
                    '<%= pkg.dist_plugins %>/datetimepicker/bootstrap-datetimepicker.4.17.37.min.css':'<%= pkg.dist_plugins %>/datetimepicker/bootstrap-datetimepicker.4.17.37.min.css',
                    '<%= pkg.dist_plugins %>/daterangepicker/daterangepicker.min.css':'<%= pkg.dist_plugins %>/daterangepicker/daterangepicker.min.css',
                    '<%= pkg.dist_plugins %>/chosen/jQuery.chosen-1.4.2.min.css': '<%= pkg.dist_plugins %>/chosen/jQuery.chosen-1.4.2.min.css',
                    '<%= pkg.dist_plugins %>/selectize/selectize-0.12.0.min.css':'<%= pkg.dist_plugins %>/selectize/selectize-0.12.0.min.css',
                    '<%= pkg.dist_plugins %>/css3spinners/css3-spinners.1.2.2.min.css':'<%= pkg.dist_plugins %>/css3spinners/css3-spinners.1.2.2.min.css',
                    '<%= pkg.dist_plugins %>/jqgrid/ui.jqgrid.min.css':'<%= pkg.dist_plugins %>/jqgrid/ui.jqgrid.min.css',
                    '<%= pkg.dist_plugins %>/dropzone/dropzone.min.css':'<%= pkg.dist_plugins %>/dropzone/dropzone.min.css',
                    '<%= pkg.dist_plugins %>/magnific/magnific.min.css':'<%= pkg.dist_plugins %>/magnific/magnific.min.css',
                    '<%= pkg.dist_plugins %>/drop/drop.min.css':'<%= pkg.dist_plugins %>/drop/drop.min.css',
                    '<%= pkg.dist_plugins %>/summernote/summernote.min.css':'<%= pkg.dist_plugins %>/summernote/summernote.min.css',
                    '<%= pkg.dist_plugins %>/wizard/wizard.min.css':'<%= pkg.dist_plugins %>/wizard/wizard.min.css',
                    '<%= pkg.dist_plugins %>/chart/chart.min.css':'<%= pkg.dist_plugins %>/chart/chart.min.css',
                    '<%= pkg.dist_plugins %>/fancytree/fancytree.min.css':'<%= pkg.dist_plugins %>/fancytree/fancytree.min.css',
                    '<%= pkg.dist_plugins %>/prism/prism.min.css':'<%= pkg.dist_plugins %>/prism/prism.min.css',
                    '<%= pkg.dist_plugins %>/intro/intro.min.css':'<%= pkg.dist_plugins %>/intro/intro.min.css',
                    '<%= pkg.dist_plugins %>/hierarchicalselect/hierarchicalselect.min.css':'<%= pkg.dist_plugins %>/hierarchicalselect/hierarchicalselect.min.css',
                    '<%= pkg.dist_plugins %>/bootstrap-multiselect/bootstrap-multiselect.min.css':'<%= pkg.dist_plugins %>/bootstrap-multiselect/bootstrap-multiselect.min.css',
                    '<%= pkg.dist_plugins %>/jquery-custom-scrollbar/jquery-custom-scrollbar-0.5.5.min.css':'<%= pkg.dist_plugins %>/jquery-custom-scrollbar/jquery-custom-scrollbar-0.5.5.min.css'
                }
            },
            jquery: {
                src: '<%= pkg.dist_styles %>/lib/jquery-ui-custom.1.11.4.min.css',
                dest: '<%= pkg.dist_styles %>/lib/jquery-ui-custom.1.11.4.min.css'
            }
        },

        // Concatenates JS files.
        concat: {
            options: {
                stripBanners: false
            },
            frontend: {
                src: [
                    '<%= pkg.data_scripts%>/base/custom/mod_photonTranslations.js',
                    '<%= pkg.data_plugins %>/nprogress/js/nprogress.js',
                    '<%= pkg.data_scripts %>/base/util.bs4.js',
                    '<%= pkg.data_scripts %>/base/transition.js',
                    '<%= pkg.data_scripts %>/base/alert.js',
                    '<%= pkg.data_scripts %>/base/button.js',
                    '<%= pkg.data_scripts %>/base/carousel.js',
                    '<%= pkg.data_scripts %>/base/collapse.js',
                    '<%= pkg.data_scripts %>/base/dropdown.js',
                    '<%= pkg.data_scripts %>/base/modal.js',
                    '<%= pkg.data_scripts %>/base/tooltip.bs4.js',
                    '<%= pkg.data_scripts %>/base/popover.bs4.js',
                    '<%= pkg.data_scripts %>/base/scrollspy.js',
                    '<%= pkg.data_scripts %>/base/tab.js',
                    '<%= pkg.data_scripts %>/base/affix.js',
                    '<%= pkg.data_plugins %>/jquery-custom-scrollbar/js/jquery.custom-scrollbar.js',
                    '<%= pkg.data_scripts %>/base/custom/mod_sidebar.js',
                    '<%= pkg.data_scripts %>/base/custom/mod_photonDataFormatter.js',
                    '<%= pkg.data_plugins%>/notify/js/bootstrap-notify.js',
                    '<%= pkg.data_plugins%>/blockui/js/jQuery.blockui.2.70.0.js',
                    '<%= pkg.data_scripts %>/base/custom/mod_photonModal.js',
                    '<%= pkg.data_scripts %>/base/custom/mod_customInput.js',
                    '<%= pkg.data_scripts %>/base/custom/mod_tooltip.js',
                    '<%= pkg.data_scripts %>/base/custom/mod_popover.js',
                    '<%= pkg.data_scripts %>/base/custom/custom-setup.js'
                ],
                dest: '<%= pkg.dist_scripts %>/main_script.js'
            },
            jq_grid: {
                src: [
                    '<%= pkg.data_plugins %>/jqgrid/js/jquery.jqGrid.js',
                    '<%= pkg.data_scripts %>/base/custom/mod_photonJqGrid.js'
                ],
                dest: '<%= pkg.dist_plugins%>/jqgrid/jquery.jqGrid.min.js'
            },
            summernote: {
                src: [
                    '<%= pkg.data_plugins %>/summernote/js/summernote.min.js',
                    '<%= pkg.data_plugins %>/summernote/js/summernote-cleaner.js'
                ],
                dest: '<%= pkg.dist_plugins%>/summernote/summernote.min.js'
            }
        },
        php2html: {
           default: {
             options: {
               htmlhint: {
                 'doctype-first': false
               },
               processLinks: true,
               process: function(response,callback) {
                    var content = response.replace(new RegExp('.php', 'g'), '.html');
                    callback (content);
              }
             },
             files: [
                {
                  expand: true,
                  cwd: 'demo/',
                  src: ['*.php'],
                  dest: 'demo/',
                  ext: '.html'
                }
              ]
           }
        },
        // Minifies JS files
        uglify: {
            options: {
                sourceMap: false,
                sourceMapName: '<%= pkg.dist_scripts %>/main_script.min.map',
                banner: '<%= banner %>',
                mangle: {
                    except: ['jQuery']
                }
            },
            frontend: {
                files: {
                    '<%= pkg.dist_scripts %>/main_script.min.js': ['<%= pkg.dist_scripts %>/main_script.js']
                }
            },
            jquery: {
                files: {
                    '<%= pkg.dist_scripts %>/lib/jquery-ui.1.11.4.min.js': '<%= pkg.data_scripts %>/lib/jquery-ui.1.11.4.js'
                }
            },
            plugins: {
                files: {
                    '<%= pkg.dist_plugins %>/selectize/selectize-0.12.0.min.js': '<%= pkg.data_plugins %>/selectize/js/selectize.js',
                    '<%= pkg.dist_plugins %>/inputlimiter/jQuery.inputlimiter.1.3.1.min.js': '<%= pkg.data_plugins %>/inputLimiter/js/jQuery.inputlimiter.1.3.1.js',
                    '<%= pkg.dist_plugins%>/jqgrid/jquery.jqGrid.min.js' : ['<%= pkg.dist_plugins%>/jqgrid/jquery.jqGrid.min.js', '<%= pkg.data_scripts%>/base/custom/mod_photonJqGrid.js'],
                    '<%= pkg.dist_plugins%>/stickyKit/stickyKit.min.js' : ['<%= pkg.data_plugins%>/stickyKit/js/stickyKit.js', '<%= pkg.data_plugins%>/stickyKit/js/stickyKitWrapper.js'],
                    '<%= pkg.dist_plugins%>/intro/intro.min.js' : ['<%= pkg.data_plugins%>/intro/js/intro.js'],
                    '<%= pkg.dist_plugins%>/hierarchicalselect/hierarchicalselect.min.js' : ['<%= pkg.data_plugins%>/hierarchicalselect/js/hierarchicalselect.js'],
                    '<%= pkg.dist_plugins%>/bootstrap-multiselect/bootstrap-multiselect.min.js' : ['<%= pkg.data_plugins%>/bootstrap-multiselect/js/bootstrap-multiselect.js'],
                    '<%= pkg.dist_plugins%>/countdown/countdown.min.js' : ['<%= pkg.data_plugins%>/countdown/js/moment-timezone-with-data.js', '<%= pkg.data_plugins%>/countdown/js/jquery.countdown.js'],
                    '<%= pkg.dist_plugins %>/chosen/jQuery.chosen-1.4.2.min.js': ['<%= pkg.data_plugins %>/chosen/js/chosen.jquery.js', '<%= pkg.data_plugins %>/chosen/js/chosen.ajax.js'],
                    '<%= pkg.dist_plugins %>/dropzone/dropzone.min.js':'<%= pkg.data_plugins %>/dropzone/js/dropzone.js',
                    '<%= pkg.dist_plugins %>/magnific/magnific.min.js':'<%= pkg.data_plugins %>/magnific/js/magnific.js',
                    '<%= pkg.dist_plugins %>/tether/tether.min.js':'<%= pkg.data_plugins %>/tether/js/tether.1.1.1.js',
                    '<%= pkg.dist_plugins %>/drop/drop.min.js':'<%= pkg.data_plugins %>/drop/js/drop.js',
                    '<%= pkg.dist_plugins %>/jQueryCookie/jQueryCookie.min.js':'<%= pkg.data_plugins %>/jQueryCookie/js/jquery.cookie.js',
                    '<%= pkg.dist_plugins %>/wizard/wizard.min.js':'<%= pkg.data_plugins %>/wizard/js/wizard.js',
                    '<%= pkg.dist_plugins %>/chart/chart.min.js':'<%= pkg.data_plugins %>/chart/js/chart.js',
                    '<%= pkg.dist_plugins %>/fancytree/fancytree.min.js':['<%= pkg.data_plugins %>/fancytree/js/jquery.fancytree.js', '<%= pkg.data_plugins %>/fancytree/js/jquery.fancytree.filter.js', '<%= pkg.data_scripts %>/base/custom/mod_photonFancytree.js'],
                    '<%= pkg.dist_plugins %>/prism/prism.min.js':'<%= pkg.data_plugins %>/prism/js/prism.js',
                    '<%= pkg.dist_plugins %>/jquery-custom-scrollbar/jquery.custom-scrollbar.min.js':'<%= pkg.data_plugins %>/jquery-custom-scrollbar/js/jquery.custom-scrollbar.js',
                    '<%= pkg.dist_plugins %>/daterangepicker/daterangepicker.min.js':'<%= pkg.data_plugins %>/daterangepicker/js/daterangepicker.js'
                }
            }
        },
        eslint: {
            src: ['<%= changedFile %>']
        },
        watch: {
            styles: {
                files: ['<%= pkg.data_styles %>/**/*.less'],
                tasks: ['lesslint', 'styles'],
                options: {
                    nospawn: true
                }
            },
            plugin_styles: {
                files: ['<%= pkg.data_plugins %>/**/*.less'],
                tasks: ['lesslint', 'plugin_styles'],
                options: {
                    nospawn: true
                }
            },
            scripts: {
              files: ['<%= pkg.data_scripts %>/**/*.js'],
              tasks: ['eslint', 'scripts'],
              options: {
                  nospawn: true
              }
            },
            plugin_scripts: {
              files: ['<%= pkg.data_plugins %>/**/*.js', '<%= pkg.data_scripts %>/**/*.js'],
              tasks: ['eslint', 'plugin_scripts'],
              options: {
                  nospawn: true
              }
            }
        }
    });

    // Load the grunt plugin(s)
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-autoprefixer');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-php2html');
    grunt.loadNpmTasks('grunt-lesslint');
    grunt.loadNpmTasks('grunt-browser-sync');
    grunt.loadNpmTasks('gruntify-eslint');

    // CSS distribution task.
    grunt.registerTask('styles', [
        'less:frontend',
        'less:frontend_dark',
        'autoprefixer:frontend',
        'autoprefixer:frontend_dark',
        'cssmin:frontend',
        'cssmin:frontend_dark'
    ]);

    grunt.registerTask('presentation_site', [
        'less:presentation_site',
        'autoprefixer:presentation_site',
        'cssmin:presentation_site'
    ]);

    // JS distribution task.
    grunt.registerTask('scripts', [
        'concat:frontend',
        'uglify:frontend'
    ]);

    // Generate plugin styles
    grunt.registerTask('plugin_styles', [
        'less:plugins',
        'cssmin:plugins',
        'less:jquery',
        'cssmin:jquery'
    ]);

    // Generate plugin scripts
    grunt.registerTask('plugin_scripts', [
        'concat:jq_grid',
        'concat:summernote',
        'uglify:plugins',
        'uglify:jquery'
    ]);

    // Generate plugin files
    grunt.registerTask('plugins', [
        'plugin_styles',
        'plugin_scripts'
    ]);

    // Default: Generate main styles and scripts
    grunt.registerTask('default', [
        'less:frontend',
        'autoprefixer:frontend',
        'cssmin:frontend',
        'concat:frontend',
        'uglify:frontend'
    ]);

    //Convert php to html and use pretify for it
    grunt.registerTask('convert_demo', [
        'php2html'
    ]);

    //BrowserSync task and watch
    grunt.registerTask('build', [
        'bs-init',
        'watch'
    ]);

    grunt.registerTask('bs-init', function () {
        var done = this.async();
        browserSync({
            notify: true,
            watchTask: true,
            injectChanges: true,
            server: {
                baseDir: ['./', './demo', './dist'],
                index: 'index.html'
            },
            middleware: function(req, res, next) {
                if(req.url.indexOf('emag-apps-ui-kit')) {
                    req.url = req.url.replace('/' + uiKitName, '');
                }
                return next();
            }
        }, function (err, bs) {
            done();
        });
    });

    grunt.registerTask('bs-reload', function () {
        browserSync.reload( [
            'dist/css/**/*.css',
            'dist/js/**/*.js',
            'demo/*.html'
        ]);
    });

    /**
     * Events
     */
    grunt.event.on('watch', function(action, filepath) {
        grunt.config('changedFile', filepath);
    });
};
