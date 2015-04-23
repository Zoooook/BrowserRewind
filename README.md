This Chrome extension was inspired by Session Buddy. I wanted a way to recover my tabs when chrome crashes and loses them, or when a window accidentally gets closed and you don't notice until it's too late to recover it.

Session Buddy basically takes snapshots occasionally, or on demand, and lets you manage them. I wanted something more detailed.

This extension uses an event sourcing model to display and recreate the browser state at any time since installation. This includes windows, tab ordering, pinned tabs, and active tabs. It does not include tab back/forward history, or incognito windows.

Every time anything changes, an event is logged. Every 500 events, a snapshot is logged. Using the options page, you can pull up a snapshot by its index number, or you can input a timestamp, and it will find the nearest snapshot and then replay events until it catches up to your timestamp.

The options page displays the number of snapshots stored, the number of events stored, and the timestamps of each snapshot. When you press the Snapshot or Timestamp button to display a summary of the browser state, it gives you a Recreate button, which will restore that state to the browser. Be careful before you click that button, unless you happen to know the current timestamp so you can come back to the current state.

You can display the events themselves, which is useful for finding the timestamp of a particular event. Input the starting and ending event indexes, and press the Events button (or press the other button to display the last 100 events). There is a maximum of 500 events displayed at a time.

It needs a prettier interface of course, but right now it's functional if you can handle using timestamps. [(Converter)](http://www.epochconverter.com/)

Using the recreate button DOES fire events that are in turn logged. Your history of recreating the state is itself stored in history.
