module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    clean: ["build", "dist"],

    copy: {
      main: {
        files: [
          {
            src: '_locales/**/*',
            dest: 'dist/',
          },
          {
            src: 'icons/**/*',
            dest: 'dist/',
          },
          {
            src: 'sound/**/*',
            dest: 'dist/',
          },
          {
            src: 'style/**/*',
            dest: 'dist/',
          },
          // {
          //   src: 'sea-modules/**/*',
          //   dest: 'dist/',
          // },
          // {
          //   src: '*.html',
          //   dest: 'build/'
          // },
          {
            src: 'config.js',
            dest: 'dist/'
          },
          {
            src: 'manifest.json',
            dest: 'dist/'
          },
          {
            src: 'oauth2_inject.js',
            dest: 'dist/'
          },

          {
            src: 'sea-modules/**/*',
            dest: 'dist/',
          },
          {
            src: 'sea-modules/**/*',
            dest: 'build/',
          }
        ]
      },
      store: {
        files: [
          {
            src: 'manifest-store.json',
            dest: 'dist/manifest.json'
          },
          {
            src: '../key.pem',
            dest: 'dist/key.pem'
          }
        ]
      }
    },

    'string-replace': {
      dist: {
        files: {
          'dist/': '*.html', // includes files in dir
        },
        options: {
          replacements: [
            {
              pattern: /data-main="\.\/gegedaa/ig,
              replacement: 'data-main="gegedaa'
            }
          ]
        }
      }
    },

    transport: {
      options: {
        debug: false,
        alias: '<%= pkg.spm.alias %>',
        uglify: {
          beautify: true,
          comments: true
        }
      },
      main: {
        files : [
          {
              src : 'gegedaa/**/*',
              dest : 'build/sea-modules/'
          }
        ]
      },
      test: {
        files : [
          {
              src : 'gegedaa/view/status-wrapper.js',
              dest : 'build/sea-modules/'
          }
        ]
      }
    },

    concat: {
      main: {
        options : {
          include : 'relative'
        },
        files: [
          {
            'build/gegedaa/bg.js': ['build/sea-modules/gegedaa/bg.js'],
            'build/gegedaa/main.js': ['build/sea-modules/gegedaa/main.js'],
            'build/gegedaa/settings-main.js': ['build/sea-modules/gegedaa/settings-main.js'],
            'build/gegedaa/write.js': ['build/sea-modules/gegedaa/write.js']
          }
        ]
      }
    },

    uglify: {
      main: {
        files: {
          'dist/sea-modules/gegedaa/bg.js': 'build/gegedaa/bg.js',
          'dist/sea-modules/gegedaa/main.js': 'build/gegedaa/main.js',
          'dist/sea-modules/gegedaa/settings-main.js': 'build/gegedaa/settings-main.js',
          'dist/sea-modules/gegedaa/write.js': 'build/gegedaa/write.js'
        }
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-cmd-transport');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-cmd-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-string-replace');
  grunt.registerTask('default', ['clean', 'copy:main', 'string-replace', 'transport', 'concat', 'uglify']);
};
