import { PLUGIN_COMPONENT } from './constants';
import { getUnmatched, streamUrl } from './api-client';
import { formatFileSize, playExternal } from './utils';

export function UnmatchedComponent(object) {
    var html = $('<div></div>');
    var scroll;
    var last;

    this.create = function () {
        var self = this;
        this.activity.loader(true);

        getUnmatched()
            .then(function (data) {
                self.activity.loader(false);
                renderFiles(data.unmatched || data, self);
            })
            .catch(function (err) {
                self.activity.loader(false);
                var errEl = Lampa.Template.js(PLUGIN_COMPONENT + '_error');
                errEl.find('.lm-error__text').text(err.message);
                errEl.find('.lm-error__retry').text(Lampa.Lang.translate('local_media_retry'));
                errEl.find('.lm-error__retry').on('hover:enter', function () {
                    html.empty();
                    scroll = null;
                    last = null;
                    self.create();
                });
                html.append(errEl);
            });
    };

    function renderFiles(files, self) {
        scroll = new Lampa.Scroll({ mask: true, over: true, step: 300 });
        var body = $('<div class="lm-unmatched-content"></div>');

        if (!files || !files.length) {
            var empty = new Lampa.Empty({ descr: Lampa.Lang.translate('local_media_empty_library') });
            body.append(empty.render(true));
        } else {
            files.forEach(function (file) {
                var item = Lampa.Template.js(PLUGIN_COMPONENT + '_unmatched_item');
                item.find('.lm-unmatched__name').text(file.file_name || file.file_path || 'Unknown');
                item.find('.lm-unmatched__size').text(formatFileSize(file.file_size));

                item.on('hover:enter', function () {
                    playExternal(streamUrl(file.id), file.file_name || file.file_path);
                });

                item.on('hover:focus', function () {
                    last = $(this)[0];
                    scroll.update($(this));
                });

                body.append(item);
            });
        }

        scroll.minus();
        scroll.append(body);
        html.append(scroll.render());

        self.activity.toggle();
    }

    this.start = function () {
        if (Lampa.Activity.active() && Lampa.Activity.active().activity !== this.activity) return;

        Lampa.Controller.add('content', {
            link: this,
            toggle: function () {
                Lampa.Controller.collectionSet(scroll.render());
                Lampa.Controller.collectionFocus(last || false, scroll.render());
            },
            left: function () {
                if (typeof Navigator !== 'undefined' && Navigator.canmove('left')) Navigator.move('left');
                else Lampa.Controller.toggle('menu');
            },
            up: function () {
                if (typeof Navigator !== 'undefined' && Navigator.canmove('up')) Navigator.move('up');
                else Lampa.Controller.toggle('head');
            },
            right: function () {
                if (typeof Navigator !== 'undefined' && Navigator.canmove('right')) Navigator.move('right');
            },
            down: function () {
                if (typeof Navigator !== 'undefined' && Navigator.canmove('down')) Navigator.move('down');
            },
            back: function () { Lampa.Activity.backward(); }
        });
        Lampa.Controller.toggle('content');
    };

    this.pause = function () {};
    this.stop = function () {};
    this.render = function () { return html; };
    this.destroy = function () {
        if (scroll) scroll.destroy();
        html.remove();
    };
}
